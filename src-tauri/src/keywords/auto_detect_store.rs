use crate::engine::types::AutoDetectOptions;
use crate::error::AppError;
use std::fs;
use std::path::Path;

pub fn load_auto_detect_config(path: &Path) -> Result<AutoDetectOptions, AppError> {
    if !path.exists() {
        return Ok(AutoDetectOptions::default());
    }
    let contents = fs::read_to_string(path)?;
    let config: AutoDetectOptions = serde_json::from_str(&contents)?;
    Ok(config)
}

pub fn save_auto_detect_config(
    path: &Path,
    config: &AutoDetectOptions,
) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(config)?;
    fs::write(path, json)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::types::{ClassificationRule, PatternConfig};
    use tempfile::tempdir;

    #[test]
    fn save_and_load_auto_detect_config() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("auto-detect.json");

        let mut config = AutoDetectOptions::default();
        config.email.rules.push(ClassificationRule {
            pattern: "acme.com".to_string(),
            label: "ACME_CORP".to_string(),
        });
        config.ip.rules.push(ClassificationRule {
            pattern: "10.0.0.0/8".to_string(),
            label: "INTERNAL".to_string(),
        });

        save_auto_detect_config(&path, &config).unwrap();
        let loaded = load_auto_detect_config(&path).unwrap();

        assert!(loaded.email.enabled);
        assert_eq!(loaded.email.rules.len(), 1);
        assert_eq!(loaded.email.rules[0].label, "ACME_CORP");
        assert_eq!(loaded.ip.rules.len(), 1);
        assert_eq!(loaded.ip.rules[0].pattern, "10.0.0.0/8");
    }

    #[test]
    fn load_missing_returns_default() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("nonexistent.json");
        let config = load_auto_detect_config(&path).unwrap();
        assert!(config.email.enabled);
        assert!(config.email.rules.is_empty());
    }

    #[test]
    fn load_old_config_without_new_fields() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("auto-detect.json");

        // Simulate an old config file without mac/phone/url fields
        let old_json = r#"{
            "email": {"enabled": true, "rules": []},
            "ip": {"enabled": true, "rules": []},
            "hostname": {"enabled": true, "rules": []},
            "path": {"enabled": true, "rules": []},
            "username": {"enabled": true, "rules": []}
        }"#;
        std::fs::write(&path, old_json).unwrap();

        let config = load_auto_detect_config(&path).unwrap();
        // New fields should default gracefully
        assert!(config.mac.enabled);
        assert!(config.mac.rules.is_empty());
        assert!(config.phone.enabled);
        assert!(config.phone.rules.is_empty());
        assert!(config.url.enabled);
        assert!(config.url.rules.is_empty());
    }

    #[test]
    fn disabled_pattern_persists() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("auto-detect.json");

        let mut config = AutoDetectOptions::default();
        config.hostname = PatternConfig {
            enabled: false,
            rules: Vec::new(),
        };

        save_auto_detect_config(&path, &config).unwrap();
        let loaded = load_auto_detect_config(&path).unwrap();
        assert!(!loaded.hostname.enabled);
    }
}
