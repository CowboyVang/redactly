use crate::engine::types::RedactionMapping;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
struct SessionFile {
    version: u32,
    active_session: String,
    sessions: HashMap<String, SessionData>,
}

#[derive(Serialize, Deserialize)]
struct SessionData {
    mappings: Vec<RedactionMapping>,
    created: String,
    last_used: String,
}

pub fn save_session(dir: &Path, mappings: &[RedactionMapping]) -> Result<(), AppError> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut sessions = HashMap::new();
    sessions.insert(
        "default".to_string(),
        SessionData {
            mappings: mappings.to_vec(),
            created: now.clone(),
            last_used: now,
        },
    );

    let file = SessionFile {
        version: 1,
        active_session: "default".to_string(),
        sessions,
    };

    let path = dir.join("redact-map.json");
    let json = serde_json::to_string_pretty(&file)?;
    fs::write(&path, json)?;
    Ok(())
}

pub fn load_session(dir: &Path) -> Result<Vec<RedactionMapping>, AppError> {
    let path = dir.join("redact-map.json");
    let legacy_path = dir.join(".redact-map.json");

    let file_path = if path.exists() {
        path
    } else if legacy_path.exists() {
        legacy_path
    } else {
        return Ok(Vec::new());
    };

    let contents = fs::read_to_string(&file_path)?;
    let file: SessionFile = serde_json::from_str(&contents)?;

    if let Some(session) = file.sessions.get(&file.active_session) {
        Ok(session.mappings.clone())
    } else {
        Ok(Vec::new())
    }
}

pub fn export_session(path: &Path, mappings: &[RedactionMapping]) -> Result<(), AppError> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut sessions = HashMap::new();
    sessions.insert(
        "default".to_string(),
        SessionData {
            mappings: mappings.to_vec(),
            created: now.clone(),
            last_used: now,
        },
    );

    let file = SessionFile {
        version: 1,
        active_session: "default".to_string(),
        sessions,
    };

    let json = serde_json::to_string_pretty(&file)?;
    fs::write(path, json)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::types::*;
    use tempfile::tempdir;

    fn test_mappings() -> Vec<RedactionMapping> {
        vec![RedactionMapping {
            token: "{PEOPLE-1}".to_string(),
            original: "John".to_string(),
            source: DetectionSource::Keyword {
                category: "People".to_string(),
            },
        }]
    }

    #[test]
    fn save_and_load_session() {
        let dir = tempdir().unwrap();
        save_session(dir.path(), &test_mappings()).unwrap();

        // Verify file is created without dot prefix
        assert!(dir.path().join("redact-map.json").exists());
        assert!(!dir.path().join(".redact-map.json").exists());

        let loaded = load_session(dir.path()).unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].token, "{PEOPLE-1}");
    }

    #[test]
    fn load_missing_file_returns_empty() {
        let dir = tempdir().unwrap();
        let loaded = load_session(dir.path()).unwrap();
        assert!(loaded.is_empty());
    }

    #[test]
    fn load_legacy_dotfile() {
        let dir = tempdir().unwrap();
        // Manually write a legacy .redact-map.json
        let legacy_path = dir.path().join(".redact-map.json");
        let content = serde_json::to_string_pretty(&SessionFile {
            version: 1,
            active_session: "default".to_string(),
            sessions: {
                let mut m = HashMap::new();
                m.insert("default".to_string(), SessionData {
                    mappings: test_mappings(),
                    created: "2026-01-01T00:00:00Z".to_string(),
                    last_used: "2026-01-01T00:00:00Z".to_string(),
                });
                m
            },
        }).unwrap();
        fs::write(&legacy_path, content).unwrap();

        let loaded = load_session(dir.path()).unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].original, "John");
    }

    #[test]
    fn new_file_takes_precedence_over_legacy() {
        let dir = tempdir().unwrap();

        // Write legacy file with "Jane"
        let legacy_path = dir.path().join(".redact-map.json");
        let legacy_mapping = vec![RedactionMapping {
            token: "{PEOPLE-1}".to_string(),
            original: "Jane".to_string(),
            source: DetectionSource::Keyword { category: "People".to_string() },
        }];
        let content = serde_json::to_string_pretty(&SessionFile {
            version: 1,
            active_session: "default".to_string(),
            sessions: {
                let mut m = HashMap::new();
                m.insert("default".to_string(), SessionData {
                    mappings: legacy_mapping,
                    created: "2026-01-01T00:00:00Z".to_string(),
                    last_used: "2026-01-01T00:00:00Z".to_string(),
                });
                m
            },
        }).unwrap();
        fs::write(&legacy_path, content).unwrap();

        // Write new file with "John" via save_session
        save_session(dir.path(), &test_mappings()).unwrap();

        let loaded = load_session(dir.path()).unwrap();
        assert_eq!(loaded[0].original, "John"); // new file wins
    }

    #[test]
    fn export_session_to_custom_path() {
        let dir = tempdir().unwrap();
        let export_path = dir.path().join("custom-export.json");
        export_session(&export_path, &test_mappings()).unwrap();

        assert!(export_path.exists());
        let contents = fs::read_to_string(&export_path).unwrap();
        let file: SessionFile = serde_json::from_str(&contents).unwrap();
        assert_eq!(file.sessions["default"].mappings[0].token, "{PEOPLE-1}");
    }
}
