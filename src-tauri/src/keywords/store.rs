use crate::engine::types::KeywordCategory;
use crate::error::AppError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
struct KeywordFile {
    categories: Vec<KeywordCategory>,
}

pub fn load_keywords(path: &Path) -> Result<Vec<KeywordCategory>, AppError> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents = fs::read_to_string(path)?;
    let file: KeywordFile = serde_json::from_str(&contents)?;
    Ok(file.categories)
}

pub fn export_keywords(path: &Path, categories: &[KeywordCategory]) -> Result<(), AppError> {
    save_keywords(path, categories)
}

pub fn merge_keywords(existing: &[KeywordCategory], imported: &[KeywordCategory]) -> Vec<KeywordCategory> {
    let mut result = existing.to_vec();
    for imported_cat in imported {
        if let Some(existing_cat) = result.iter_mut().find(|c| c.name == imported_cat.name) {
            for kw in &imported_cat.keywords {
                if !existing_cat.keywords.iter().any(|k| k.term == kw.term) {
                    existing_cat.keywords.push(kw.clone());
                }
            }
        } else {
            result.push(imported_cat.clone());
        }
    }
    result
}

pub fn save_keywords(path: &Path, categories: &[KeywordCategory]) -> Result<(), AppError> {
    let file = KeywordFile {
        categories: categories.to_vec(),
    };
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(&file)?;
    fs::write(path, json)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::types::*;
    use tempfile::tempdir;

    #[test]
    fn merge_adds_new_categories() {
        let existing = vec![KeywordCategory {
            name: "People".to_string(),
            keywords: vec![KeywordEntry {
                term: "John".to_string(),
                variants: false,
                fuzzy: FuzzyLevel::Off,
            }],
        }];
        let imported = vec![KeywordCategory {
            name: "Places".to_string(),
            keywords: vec![KeywordEntry {
                term: "Zurich".to_string(),
                variants: false,
                fuzzy: FuzzyLevel::Off,
            }],
        }];
        let merged = merge_keywords(&existing, &imported);
        assert_eq!(merged.len(), 2);
        assert_eq!(merged[1].name, "Places");
        assert_eq!(merged[1].keywords[0].term, "Zurich");
    }

    #[test]
    fn merge_deduplicates_keywords_in_same_category() {
        let existing = vec![KeywordCategory {
            name: "People".to_string(),
            keywords: vec![KeywordEntry {
                term: "John".to_string(),
                variants: false,
                fuzzy: FuzzyLevel::Off,
            }],
        }];
        let imported = vec![KeywordCategory {
            name: "People".to_string(),
            keywords: vec![
                KeywordEntry {
                    term: "John".to_string(),
                    variants: true,
                    fuzzy: FuzzyLevel::Low,
                },
                KeywordEntry {
                    term: "Jane".to_string(),
                    variants: false,
                    fuzzy: FuzzyLevel::Off,
                },
            ],
        }];
        let merged = merge_keywords(&existing, &imported);
        assert_eq!(merged.len(), 1);
        assert_eq!(merged[0].keywords.len(), 2);
        assert_eq!(merged[0].keywords[0].term, "John");
        // Original John's settings preserved (not overwritten)
        assert!(!merged[0].keywords[0].variants);
        assert_eq!(merged[0].keywords[1].term, "Jane");
    }

    #[test]
    fn save_and_load_keywords() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("keywords.json");
        let categories = vec![KeywordCategory {
            name: "People".to_string(),
            keywords: vec![KeywordEntry {
                term: "John".to_string(),
                variants: false,
                fuzzy: FuzzyLevel::Off,
            }],
        }];

        save_keywords(&path, &categories).unwrap();
        let loaded = load_keywords(&path).unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].name, "People");
    }
}
