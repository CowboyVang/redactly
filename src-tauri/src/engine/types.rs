use serde::{Deserialize, Serialize};

/// Types of auto-detected sensitive data patterns.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PatternType {
    Email,
    Username,
    Hostname,
    Ip,
    Path,
    Mac,
    Phone,
    Url,
}

impl PatternType {
    pub fn token_prefix(&self) -> &str {
        match self {
            PatternType::Email => "EMAIL",
            PatternType::Username => "USER",
            PatternType::Hostname => "HOST",
            PatternType::Ip => "IP",
            PatternType::Path => "PATH",
            PatternType::Mac => "MAC",
            PatternType::Phone => "PHONE",
            PatternType::Url => "URL",
        }
    }
}

/// A user-defined classification rule for auto-detected patterns.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassificationRule {
    pub pattern: String,
    pub label: String,
}

/// Per-pattern-type configuration: enabled + classification rules.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternConfig {
    pub enabled: bool,
    pub rules: Vec<ClassificationRule>,
}

impl Default for PatternConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            rules: Vec::new(),
        }
    }
}

/// Source of a detection — keyword or auto-detect pattern.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DetectionSource {
    Keyword { category: String },
    Pattern {
        pattern_type: PatternType,
        classification: Option<String>,
    },
}

/// A detected sensitive region in the input text.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
    pub source: DetectionSource,
    pub value: String,
    pub start: usize,
    pub end: usize,
}

/// A mapping from replacement token to original value.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedactionMapping {
    pub token: String,
    pub original: String,
    pub source: DetectionSource,
}

/// Result of a redaction operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedactionResult {
    pub redacted_text: String,
    pub mappings: Vec<RedactionMapping>,
    pub detection_count: usize,
}

/// Fuzzy matching sensitivity level.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FuzzyLevel {
    Off,
    Low,
    Medium,
    High,
}

/// A single keyword entry with matching configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeywordEntry {
    pub term: String,
    pub variants: bool,
    pub fuzzy: FuzzyLevel,
}

/// A named category of keywords.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeywordCategory {
    pub name: String,
    pub keywords: Vec<KeywordEntry>,
}

/// Options controlling which auto-detect patterns are enabled, with classification rules.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoDetectOptions {
    pub email: PatternConfig,
    pub ip: PatternConfig,
    pub hostname: PatternConfig,
    pub path: PatternConfig,
    pub username: PatternConfig,
    #[serde(default)]
    pub mac: PatternConfig,
    #[serde(default)]
    pub phone: PatternConfig,
    #[serde(default)]
    pub url: PatternConfig,
}

impl Default for AutoDetectOptions {
    fn default() -> Self {
        Self {
            email: PatternConfig::default(),
            ip: PatternConfig::default(),
            hostname: PatternConfig::default(),
            path: PatternConfig::default(),
            username: PatternConfig::default(),
            mac: PatternConfig::default(),
            phone: PatternConfig::default(),
            url: PatternConfig::default(),
        }
    }
}

/// Full options for a redaction request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedactOptions {
    pub auto_detect: AutoDetectOptions,
}

/// Check whether a range [start, end) overlaps any existing range in the list.
pub fn ranges_overlap(ranges: &[(usize, usize)], start: usize, end: usize) -> bool {
    ranges.iter().any(|(rs, re)| start < *re && end > *rs)
}
