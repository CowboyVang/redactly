use regex::Regex;
use crate::engine::types::PatternType;

pub(super) struct CompiledPattern {
    pub pattern_type: PatternType,
    pub regex: Regex,
}

pub struct PatternEngine {
    pub(super) patterns: Vec<CompiledPattern>,
}

impl PatternEngine {
    pub fn new() -> Self {
        let patterns = vec![
            CompiledPattern {
                pattern_type: PatternType::Email,
                regex: Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Url,
                regex: Regex::new(r"https?://[a-zA-Z0-9](?:[a-zA-Z0-9.\-]*[a-zA-Z0-9])?(?::\d{1,5})?(?:/[^\s),.:;!?\]}>]*)?").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Ip,
                regex: Regex::new(r"\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Path,
                regex: Regex::new(r"(?:/[a-zA-Z0-9._-]+){2,}").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Path,
                regex: Regex::new(r#"[A-Za-z]:\\(?:[^\\/:\*\?"<>\|\r\n]+\\)*[^\\/:\*\?"<>\|\r\n]+"#).unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Hostname,
                regex: Regex::new(r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:com|org|net|io|dev|app|co|uk|de|fr|edu|gov|biz|info|me|local|internal|lan|test|example)\b").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Mac,
                regex: Regex::new(r"\b(?:[0-9a-fA-F]{2}[:\-]){5}[0-9a-fA-F]{2}\b").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Username,
                regex: Regex::new(r"@[a-zA-Z][a-zA-Z0-9_-]{2,}").unwrap(),
            },
            CompiledPattern {
                pattern_type: PatternType::Phone,
                regex: Regex::new(r"(?:\+\d{1,3}[\s.\-]?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}|\(\d{3}\)\s?\d{3}[\s.\-]?\d{4}|\b\d{3}[\s.\-]\d{3}[\s.\-]\d{4})\b").unwrap(),
            },
        ];

        Self { patterns }
    }
}
