use std::collections::HashMap;
use crate::engine::keyword::KeywordEngine;
use crate::engine::pattern::PatternEngine;
use crate::engine::types::*;

pub struct Pipeline {
    pattern_engine: PatternEngine,
}

fn token_prefix(source: &DetectionSource) -> String {
    match source {
        DetectionSource::Keyword { category } => category.to_uppercase(),
        DetectionSource::Pattern { pattern_type, classification } => {
            match classification {
                Some(label) => format!("{}_{}", label, pattern_type.token_prefix()),
                None => pattern_type.token_prefix().to_string(),
            }
        }
    }
}

impl Pipeline {
    pub fn new() -> Self {
        Self {
            pattern_engine: PatternEngine::new(),
        }
    }

    /// Redact text using a pre-built KeywordEngine (for cached usage).
    pub fn redact_with_engine(
        &self,
        text: &str,
        keyword_engine: &KeywordEngine,
        options: &RedactOptions,
    ) -> RedactionResult {
        if text.is_empty() {
            return RedactionResult {
                redacted_text: String::new(),
                mappings: Vec::new(),
                detection_count: 0,
            };
        }

        // Step 1: Keyword detection (first priority)
        let keyword_detections = keyword_engine.detect(text);
        let excluded_ranges = KeywordEngine::detection_ranges(&keyword_detections);

        // Step 2: Pattern detection (safety net on remaining text)
        let pattern_detections = self.pattern_engine.detect_with_exclusions(
            text,
            &options.auto_detect,
            &excluded_ranges,
        );

        // Step 3: Merge and assign tokens
        let mut all_detections: Vec<Detection> = keyword_detections;
        all_detections.extend(pattern_detections);
        all_detections.sort_by_key(|d| d.start);

        let detection_count = all_detections.len();

        let mut value_to_token: HashMap<(String, String), String> = HashMap::new();
        let mut counters: HashMap<String, usize> = HashMap::new();
        let mut mappings: Vec<RedactionMapping> = Vec::new();

        for detection in &all_detections {
            let prefix = token_prefix(&detection.source);
            let key = (detection.value.clone(), prefix.clone());

            if !value_to_token.contains_key(&key) {
                let counter = counters.entry(prefix.clone()).or_insert(0);
                *counter += 1;
                let token = format!("{{{}-{}}}", prefix, counter);
                value_to_token.insert(key.clone(), token.clone());
                mappings.push(RedactionMapping {
                    token,
                    original: detection.value.clone(),
                    source: detection.source.clone(),
                });
            }
        }

        // Step 4: Replace in reverse order to preserve positions
        let mut redacted = text.to_string();
        let mut sorted = all_detections;
        sorted.sort_by(|a, b| b.start.cmp(&a.start));

        for detection in &sorted {
            let prefix = token_prefix(&detection.source);
            let key = (detection.value.clone(), prefix);
            if let Some(token) = value_to_token.get(&key) {
                redacted.replace_range(detection.start..detection.end, token);
            }
        }

        RedactionResult {
            redacted_text: redacted,
            mappings,
            detection_count,
        }
    }

    /// Convenience wrapper that builds a temporary KeywordEngine per call.
    /// Used by tests and code paths that don't cache the engine.
    #[cfg(test)]
    pub fn redact(
        &self,
        text: &str,
        categories: &[KeywordCategory],
        options: &RedactOptions,
    ) -> RedactionResult {
        let keyword_engine = KeywordEngine::new(categories);
        self.redact_with_engine(text, &keyword_engine, options)
    }

    pub fn restore(&self, text: &str, mappings: &[RedactionMapping]) -> String {
        let mut restored = text.to_string();
        for mapping in mappings {
            restored = restored.replace(&mapping.token, &mapping.original);
        }
        restored
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_categories() -> Vec<KeywordCategory> {
        vec![
            KeywordCategory {
                name: "People".to_string(),
                keywords: vec![KeywordEntry {
                    term: "John".to_string(),
                    variants: false,
                    fuzzy: FuzzyLevel::Off,
                }],
            },
            KeywordCategory {
                name: "Company".to_string(),
                keywords: vec![KeywordEntry {
                    term: "Acme".to_string(),
                    variants: false,
                    fuzzy: FuzzyLevel::Off,
                }],
            },
        ]
    }

    #[test]
    fn keywords_redacted_before_patterns() {
        let pipeline = Pipeline::new();
        let text = "John at Acme (john@acme.com) on 10.0.0.1";
        let categories = sample_categories();
        let opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        let result = pipeline.redact(text, &categories, &opts);

        assert!(result.redacted_text.contains("{PEOPLE-1}"));
        assert!(result.redacted_text.contains("{COMPANY-1}"));
        assert!(result.redacted_text.contains("{IP-1}"));
        assert!(!result.redacted_text.contains("John"));
        assert!(!result.redacted_text.contains("Acme"));
        assert!(result.detection_count >= 4);
    }

    #[test]
    fn same_value_gets_same_token() {
        let pipeline = Pipeline::new();
        let text = "John called John again";
        let categories = sample_categories();
        let opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        let result = pipeline.redact(text, &categories, &opts);

        assert_eq!(result.redacted_text, "{PEOPLE-1} called {PEOPLE-1} again");
        assert_eq!(result.mappings.len(), 1);
    }

    #[test]
    fn restore_reverses_redaction() {
        let pipeline = Pipeline::new();
        let text = "John at Acme on 10.0.0.1";
        let categories = sample_categories();
        let opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        let result = pipeline.redact(text, &categories, &opts);
        let restored = pipeline.restore(&result.redacted_text, &result.mappings);

        assert_eq!(restored, text);
    }

    #[test]
    fn empty_text() {
        let pipeline = Pipeline::new();
        let result = pipeline.redact("", &[], &RedactOptions { auto_detect: AutoDetectOptions::default() });
        assert_eq!(result.redacted_text, "");
        assert_eq!(result.mappings.len(), 0);
    }

    #[test]
    fn classified_pattern_produces_labeled_token() {
        let pipeline = Pipeline::new();
        let mut opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        opts.auto_detect.email.rules.push(ClassificationRule {
            pattern: "acme.com".to_string(),
            label: "ACME_CORP".to_string(),
        });
        let text = "Contact support@acme.com for help";
        let result = pipeline.redact(text, &[], &opts);
        assert!(result.redacted_text.contains("{ACME_CORP_EMAIL-1}"));
        assert!(!result.redacted_text.contains("support@acme.com"));
    }

    #[test]
    fn unclassified_pattern_uses_generic_token() {
        let pipeline = Pipeline::new();
        let mut opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        opts.auto_detect.email.rules.push(ClassificationRule {
            pattern: "acme.com".to_string(),
            label: "ACME_CORP".to_string(),
        });
        let text = "Contact user@gmail.com for help";
        let result = pipeline.redact(text, &[], &opts);
        assert!(result.redacted_text.contains("{EMAIL-1}"));
        assert!(!result.redacted_text.contains("{ACME_CORP_EMAIL"));
    }

    #[test]
    fn same_classified_value_gets_same_token() {
        let pipeline = Pipeline::new();
        let mut opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        opts.auto_detect.ip.rules.push(ClassificationRule {
            pattern: "10.0.0.0/8".to_string(),
            label: "INTERNAL".to_string(),
        });
        let text = "Server 10.1.2.3 and also 10.1.2.3 again";
        let result = pipeline.redact(text, &[], &opts);
        assert_eq!(result.redacted_text, "Server {INTERNAL_IP-1} and also {INTERNAL_IP-1} again");
        assert_eq!(result.mappings.len(), 1);
    }

    #[test]
    fn mixed_classified_and_unclassified() {
        let pipeline = Pipeline::new();
        let mut opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        opts.auto_detect.email.rules.push(ClassificationRule {
            pattern: "acme.com".to_string(),
            label: "ACME_CORP".to_string(),
        });
        opts.auto_detect.ip.rules.push(ClassificationRule {
            pattern: "10.0.0.0/8".to_string(),
            label: "INTERNAL".to_string(),
        });
        let text = "Contact john@acme.com at 10.50.1.20 or user@gmail.com at 8.8.8.8";
        let result = pipeline.redact(text, &[], &opts);
        assert!(result.redacted_text.contains("{ACME_CORP_EMAIL-1}"));
        assert!(result.redacted_text.contains("{INTERNAL_IP-1}"));
        assert!(result.redacted_text.contains("{EMAIL-1}"));
        assert!(result.redacted_text.contains("{IP-1}"));
    }

    #[test]
    fn restore_works_with_classified_tokens() {
        let pipeline = Pipeline::new();
        let mut opts = RedactOptions { auto_detect: AutoDetectOptions::default() };
        opts.auto_detect.email.rules.push(ClassificationRule {
            pattern: "acme.com".to_string(),
            label: "ACME_CORP".to_string(),
        });
        opts.auto_detect.ip.rules.push(ClassificationRule {
            pattern: "10.0.0.0/8".to_string(),
            label: "INTERNAL".to_string(),
        });
        let text = "Contact john@acme.com at 10.50.1.20 or user@gmail.com at 8.8.8.8";
        let result = pipeline.redact(text, &[], &opts);
        let restored = pipeline.restore(&result.redacted_text, &result.mappings);
        assert_eq!(restored, text);
    }
}
