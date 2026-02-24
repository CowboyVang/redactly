use crate::engine::types::RedactionMapping;
use std::path::PathBuf;

pub struct SessionManager {
    mappings: Vec<RedactionMapping>,
    workspace_dir: Option<PathBuf>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            mappings: Vec::new(),
            workspace_dir: None,
        }
    }

    pub fn mappings(&self) -> &[RedactionMapping] {
        &self.mappings
    }

    pub fn add_mappings(&mut self, new_mappings: Vec<RedactionMapping>) {
        self.mappings.extend(new_mappings);
    }

    pub fn remove_mapping(&mut self, index: usize) -> bool {
        if index < self.mappings.len() {
            self.mappings.remove(index);
            true
        } else {
            false
        }
    }

    pub fn clear(&mut self) {
        self.mappings.clear();
    }

    pub fn workspace_dir(&self) -> Option<&PathBuf> {
        self.workspace_dir.as_ref()
    }

    pub fn set_workspace_dir(&mut self, dir: PathBuf) {
        self.workspace_dir = Some(dir);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::types::*;

    #[test]
    fn new_session_is_empty() {
        let session = SessionManager::new();
        assert!(session.mappings().is_empty());
        assert!(session.workspace_dir().is_none());
    }

    #[test]
    fn redact_stores_mappings() {
        let mut session = SessionManager::new();
        let mappings = vec![RedactionMapping {
            token: "{PEOPLE-1}".to_string(),
            original: "John".to_string(),
            source: DetectionSource::Keyword { category: "People".to_string() },
        }];
        session.add_mappings(mappings);
        assert_eq!(session.mappings().len(), 1);
        assert_eq!(session.mappings()[0].token, "{PEOPLE-1}");
    }

    #[test]
    fn remove_mapping_by_index() {
        let mut session = SessionManager::new();
        session.add_mappings(vec![
            RedactionMapping {
                token: "{PEOPLE-1}".to_string(),
                original: "John".to_string(),
                source: DetectionSource::Keyword { category: "People".to_string() },
            },
            RedactionMapping {
                token: "{IP-1}".to_string(),
                original: "10.0.0.1".to_string(),
                source: DetectionSource::Pattern { pattern_type: PatternType::Ip, classification: None },
            },
        ]);
        assert!(session.remove_mapping(0));
        assert_eq!(session.mappings().len(), 1);
        assert_eq!(session.mappings()[0].token, "{IP-1}");
    }

    #[test]
    fn remove_mapping_out_of_bounds() {
        let mut session = SessionManager::new();
        session.add_mappings(vec![RedactionMapping {
            token: "{PEOPLE-1}".to_string(),
            original: "John".to_string(),
            source: DetectionSource::Keyword { category: "People".to_string() },
        }]);
        assert!(!session.remove_mapping(5));
        assert_eq!(session.mappings().len(), 1);
    }

    #[test]
    fn clear_resets_session() {
        let mut session = SessionManager::new();
        session.add_mappings(vec![RedactionMapping {
            token: "{IP-1}".to_string(),
            original: "10.0.0.1".to_string(),
            source: DetectionSource::Pattern { pattern_type: PatternType::Ip, classification: None },
        }]);
        session.clear();
        assert!(session.mappings().is_empty());
    }
}
