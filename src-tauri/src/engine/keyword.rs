use crate::engine::types::*;
use strsim::normalized_levenshtein;
use unicode_normalization::UnicodeNormalization;

/// Prepared keyword for matching.
struct PreparedKeyword {
    term: String,
    lower_term: String,
    first_word: Option<String>,
    category: String,
    variants: bool,
    fuzzy: FuzzyLevel,
}

pub struct KeywordEngine {
    keywords: Vec<PreparedKeyword>,
}

impl KeywordEngine {
    pub fn new(categories: &[KeywordCategory]) -> Self {
        let mut keywords = Vec::new();

        for cat in categories {
            for kw in &cat.keywords {
                let lower = kw.term.to_lowercase().nfc().collect::<String>();
                let first_word = if kw.variants {
                    kw.term.split_whitespace().next().map(|w| w.to_lowercase().nfc().collect::<String>())
                } else {
                    None
                };

                keywords.push(PreparedKeyword {
                    term: kw.term.clone(),
                    lower_term: lower,
                    first_word,
                    category: cat.name.clone(),
                    variants: kw.variants,
                    fuzzy: kw.fuzzy.clone(),
                });
            }
        }

        // Sort by term length descending — match longer terms first
        keywords.sort_by(|a, b| b.term.len().cmp(&a.term.len()));

        Self { keywords }
    }

    /// Detect all keyword matches in the text. Returns detections sorted by position.
    pub fn detect(&self, text: &str) -> Vec<Detection> {
        let lower_text = text.to_lowercase();
        let mut detections: Vec<Detection> = Vec::new();
        let mut covered: Vec<(usize, usize)> = Vec::new();

        for kw in &self.keywords {
            // 1. Exact / case-insensitive match
            self.find_case_insensitive(text, &lower_text, kw, &mut detections, &mut covered);

            // 2. Variant matching (first word of multi-word term)
            if kw.variants {
                if let Some(ref first) = kw.first_word {
                    if first != &kw.lower_term {
                        self.find_word_variant(text, &lower_text, first, kw, &mut detections, &mut covered);
                    }
                }
            }

            // 3. Fuzzy matching
            if kw.fuzzy != FuzzyLevel::Off {
                self.find_fuzzy(text, kw, &mut detections, &mut covered);
            }
        }

        detections.sort_by_key(|d| d.start);
        detections
    }

    /// Returns the ranges of all detections (for passing to PatternEngine as exclusions).
    pub fn detection_ranges(detections: &[Detection]) -> Vec<(usize, usize)> {
        detections.iter().map(|d| (d.start, d.end)).collect()
    }

    fn find_case_insensitive(
        &self,
        text: &str,
        lower_text: &str,
        kw: &PreparedKeyword,
        detections: &mut Vec<Detection>,
        covered: &mut Vec<(usize, usize)>,
    ) {
        let needle = &kw.lower_term;
        let mut search_from = 0;

        while let Some(pos) = lower_text[search_from..].find(needle.as_str()) {
            let start = search_from + pos;
            let end = start + kw.term.len();

            if !ranges_overlap(covered, start, end) && self.is_word_boundary(text, start, end) {
                detections.push(Detection {
                    source: DetectionSource::Keyword { category: kw.category.clone() },
                    value: text[start..end].to_string(),
                    start,
                    end,
                });
                covered.push((start, end));
            }

            search_from = start + 1;
        }
    }

    fn find_word_variant(
        &self,
        text: &str,
        lower_text: &str,
        variant: &str,
        kw: &PreparedKeyword,
        detections: &mut Vec<Detection>,
        covered: &mut Vec<(usize, usize)>,
    ) {
        let mut search_from = 0;

        while let Some(pos) = lower_text[search_from..].find(variant) {
            let start = search_from + pos;
            let end = start + variant.len();

            if !ranges_overlap(covered, start, end) && self.is_word_boundary(text, start, end) {
                detections.push(Detection {
                    source: DetectionSource::Keyword { category: kw.category.clone() },
                    value: text[start..end].to_string(),
                    start,
                    end,
                });
                covered.push((start, end));
            }

            search_from = start + 1;
        }
    }

    fn find_fuzzy(
        &self,
        text: &str,
        kw: &PreparedKeyword,
        detections: &mut Vec<Detection>,
        covered: &mut Vec<(usize, usize)>,
    ) {
        let threshold = match kw.fuzzy {
            FuzzyLevel::Low => 0.75,
            FuzzyLevel::Medium => 0.60,
            FuzzyLevel::High => 0.45,
            FuzzyLevel::Off => return,
        };

        let term_words: Vec<&str> = kw.term.split_whitespace().collect();
        let term_word_count = term_words.len();
        let words: Vec<(usize, &str)> = self.word_positions(text);

        // Slide a window of term_word_count words across the text
        for window in words.windows(term_word_count) {
            let start = window[0].0;
            let last = &window[term_word_count - 1];
            let end = last.0 + last.1.len();
            let candidate = &text[start..end];

            if ranges_overlap(covered, start, end) {
                continue;
            }

            let normalized_candidate: String = candidate.to_lowercase().nfc().collect();
            let similarity = normalized_levenshtein(&normalized_candidate, &kw.lower_term);
            if similarity >= threshold && similarity < 1.0 {
                detections.push(Detection {
                    source: DetectionSource::Keyword { category: kw.category.clone() },
                    value: candidate.to_string(),
                    start,
                    end,
                });
                covered.push((start, end));
            }
        }
    }

    fn word_positions<'a>(&self, text: &'a str) -> Vec<(usize, &'a str)> {
        let mut result = Vec::new();
        let mut chars = text.char_indices().peekable();

        while let Some(&(i, c)) = chars.peek() {
            if c.is_alphanumeric() {
                let start = i;
                while let Some(&(_, c)) = chars.peek() {
                    if c.is_alphanumeric() || c == '-' || c == '_' {
                        chars.next();
                    } else {
                        break;
                    }
                }
                let end = chars.peek().map_or(text.len(), |&(i, _)| i);
                result.push((start, &text[start..end]));
            } else {
                chars.next();
            }
        }

        result
    }

    fn is_word_boundary(&self, text: &str, start: usize, end: usize) -> bool {
        let before_ok = start == 0 || !text[..start].chars().last().map_or(false, |c| c.is_alphanumeric());
        let after_ok = end >= text.len() || !text[end..].chars().next().map_or(false, |c| c.is_alphanumeric());
        before_ok && after_ok
    }

}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_category(name: &str, keywords: Vec<(&str, bool, FuzzyLevel)>) -> KeywordCategory {
        KeywordCategory {
            name: name.to_string(),
            keywords: keywords.into_iter().map(|(term, variants, fuzzy)| KeywordEntry {
                term: term.to_string(),
                variants,
                fuzzy,
            }).collect(),
        }
    }

    #[test]
    fn exact_match() {
        let categories = vec![make_category("Company", vec![("Acme Corp", false, FuzzyLevel::Off)])];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("Contact Acme Corp about the deal");
        assert_eq!(detections.len(), 1);
        assert_eq!(detections[0].value, "Acme Corp");
    }

    #[test]
    fn case_insensitive_match() {
        let categories = vec![make_category("Company", vec![("Acme Corp", false, FuzzyLevel::Off)])];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("Contact acme corp about the deal");
        assert_eq!(detections.len(), 1);
        assert_eq!(detections[0].value, "acme corp");
    }

    #[test]
    fn variant_matching() {
        let categories = vec![make_category("Company", vec![("Acme Corp", true, FuzzyLevel::Off)])];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("Contact Acme about the deal");
        assert_eq!(detections.len(), 1);
        assert_eq!(detections[0].value, "Acme");
    }

    #[test]
    fn fuzzy_low_match() {
        let categories = vec![make_category("Company", vec![("Acme Corp", false, FuzzyLevel::Low)])];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("Contact Acme Crop about the deal");
        assert_eq!(detections.len(), 1);
        assert_eq!(detections[0].value, "Acme Crop");
    }

    #[test]
    fn multiple_categories() {
        let categories = vec![
            make_category("People", vec![("John", false, FuzzyLevel::Off)]),
            make_category("Company", vec![("Acme", false, FuzzyLevel::Off)]),
        ];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("John works at Acme");
        assert_eq!(detections.len(), 2);
    }

    #[test]
    fn no_false_positives() {
        let categories = vec![make_category("Company", vec![("Acme Corp", false, FuzzyLevel::Off)])];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("This text has no sensitive data");
        assert_eq!(detections.len(), 0);
    }

    #[test]
    fn returns_category_in_source() {
        let categories = vec![make_category("People", vec![("Sarah", false, FuzzyLevel::Off)])];
        let engine = KeywordEngine::new(&categories);
        let detections = engine.detect("Ask Sarah about it");
        assert_eq!(detections[0].source, DetectionSource::Keyword { category: "People".to_string() });
    }
}
