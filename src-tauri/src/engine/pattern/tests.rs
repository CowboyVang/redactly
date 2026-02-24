use super::*;
use crate::engine::types::*;

#[test]
fn detects_email() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Contact john@example.com for details", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].value, "john@example.com");
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Email, .. }));
}

#[test]
fn detects_ipv4() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Server at 192.168.1.100 is down", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].value, "192.168.1.100");
}

#[test]
fn detects_hostname() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Visit api.example.com for docs", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].value, "api.example.com");
}

#[test]
fn detects_unix_path() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("File at /home/user/data.txt", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].value, "/home/user/data.txt");
}

#[test]
fn detects_windows_path() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("See C:\\Users\\Admin\\file.log", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(detections[0].value.starts_with("C:\\"));
}

#[test]
fn respects_disabled_patterns() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.email.enabled = false;
    let detections = engine.detect_with_exclusions("Contact john@example.com", &opts, &[]);
    assert!(detections.iter().all(|d| !matches!(d.source, DetectionSource::Pattern { pattern_type: PatternType::Email, .. })));
}

#[test]
fn no_overlapping_detections() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("john@api.example.com", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Email, .. }));
}

#[test]
fn multiple_types_in_one_text() {
    let engine = PatternEngine::new();
    let text = "User john@acme.com on 10.0.0.1 at /var/log/syslog";
    let detections = engine.detect_with_exclusions(text, &AutoDetectOptions::default(), &[]);
    assert!(detections.len() >= 3);
}

// --- Classification tests ---

#[test]
fn classify_email_domain_suffix() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.email.rules.push(ClassificationRule { pattern: "acme.com".to_string(), label: "ACME_CORP".to_string() });
    let result = engine.classify("john@acme.com", &PatternType::Email, &opts);
    assert_eq!(result, Some("ACME_CORP".to_string()));
}

#[test]
fn classify_email_subdomain() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.email.rules.push(ClassificationRule { pattern: "acme.com".to_string(), label: "ACME_CORP".to_string() });
    let result = engine.classify("jane@sub.acme.com", &PatternType::Email, &opts);
    assert_eq!(result, Some("ACME_CORP".to_string()));
}

#[test]
fn classify_email_no_match() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.email.rules.push(ClassificationRule { pattern: "acme.com".to_string(), label: "ACME_CORP".to_string() });
    let result = engine.classify("user@gmail.com", &PatternType::Email, &opts);
    assert_eq!(result, None);
}

#[test]
fn classify_ip_cidr() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.ip.rules.push(ClassificationRule { pattern: "10.0.0.0/8".to_string(), label: "INTERNAL".to_string() });
    let result = engine.classify("10.50.1.20", &PatternType::Ip, &opts);
    assert_eq!(result, Some("INTERNAL".to_string()));
}

#[test]
fn classify_ip_cidr_no_match() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.ip.rules.push(ClassificationRule { pattern: "10.0.0.0/8".to_string(), label: "INTERNAL".to_string() });
    let result = engine.classify("8.8.8.8", &PatternType::Ip, &opts);
    assert_eq!(result, None);
}

#[test]
fn classify_ip_prefix_string() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.ip.rules.push(ClassificationRule { pattern: "192.168.1.".to_string(), label: "OFFICE".to_string() });
    let result = engine.classify("192.168.1.50", &PatternType::Ip, &opts);
    assert_eq!(result, Some("OFFICE".to_string()));
}

#[test]
fn classify_hostname_suffix() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.hostname.rules.push(ClassificationRule { pattern: ".internal".to_string(), label: "INTERNAL".to_string() });
    let result = engine.classify("server.internal", &PatternType::Hostname, &opts);
    assert_eq!(result, Some("INTERNAL".to_string()));
}

#[test]
fn classify_path_prefix() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.path.rules.push(ClassificationRule { pattern: "/home/admin".to_string(), label: "ADMIN".to_string() });
    let result = engine.classify("/home/admin/docs/file.txt", &PatternType::Path, &opts);
    assert_eq!(result, Some("ADMIN".to_string()));
}

#[test]
fn classify_username_exact() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.username.rules.push(ClassificationRule { pattern: "@johndoe".to_string(), label: "ADMIN_USER".to_string() });
    let result = engine.classify("@johndoe", &PatternType::Username, &opts);
    assert_eq!(result, Some("ADMIN_USER".to_string()));
}

#[test]
fn classify_first_rule_wins() {
    let engine = PatternEngine::new();
    let mut opts = AutoDetectOptions::default();
    opts.email.rules.push(ClassificationRule { pattern: "acme.com".to_string(), label: "ACME_CORP".to_string() });
    opts.email.rules.push(ClassificationRule { pattern: "acme.com".to_string(), label: "SECOND_MATCH".to_string() });
    let result = engine.classify("john@acme.com", &PatternType::Email, &opts);
    assert_eq!(result, Some("ACME_CORP".to_string()));
}

#[test]
fn classify_no_rules_returns_none() {
    let engine = PatternEngine::new();
    let opts = AutoDetectOptions::default();
    let result = engine.classify("john@example.com", &PatternType::Email, &opts);
    assert_eq!(result, None);
}

// --- MAC address tests ---

#[test]
fn detects_mac_colon() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Device MAC aa:bb:cc:dd:ee:ff online", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].value, "aa:bb:cc:dd:ee:ff");
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Mac, .. }));
}

#[test]
fn detects_mac_dash() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Device MAC AA-BB-CC-DD-EE-FF online", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert_eq!(detections[0].value, "AA-BB-CC-DD-EE-FF");
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Mac, .. }));
}

// --- Phone number tests ---

#[test]
fn detects_phone_international() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Call +1-555-123-4567 for info", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Phone, .. }));
}

#[test]
fn detects_phone_parens() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Call (555) 123-4567 today", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Phone, .. }));
}

// --- URL tests ---

#[test]
fn detects_url() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Visit https://example.com/path?q=1 for docs", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Url, .. }));
}

#[test]
fn detects_url_http() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Go to http://internal.corp/api/v2 now", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Url, .. }));
}

#[test]
fn url_priority_over_hostname() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("See https://api.example.com/docs for info", &AutoDetectOptions::default(), &[]);
    assert_eq!(detections.len(), 1);
    assert!(matches!(detections[0].source, DetectionSource::Pattern { pattern_type: PatternType::Url, .. }));
}

#[test]
fn phone_no_false_positive_bare_digits() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Account 5551234567 is active", &AutoDetectOptions::default(), &[]);
    assert!(
        detections.iter().all(|d| !matches!(d.source, DetectionSource::Pattern { pattern_type: PatternType::Phone, .. })),
        "Bare 10-digit number should not match as phone"
    );
}

#[test]
fn url_no_trailing_punctuation() {
    let engine = PatternEngine::new();
    let detections = engine.detect_with_exclusions("Visit https://example.com/path.", &AutoDetectOptions::default(), &[]);
    let url_det: Vec<_> = detections.iter().filter(|d| matches!(d.source, DetectionSource::Pattern { pattern_type: PatternType::Url, .. })).collect();
    assert_eq!(url_det.len(), 1);
    assert_eq!(url_det[0].value, "https://example.com/path", "Trailing period should not be captured in URL");
}
