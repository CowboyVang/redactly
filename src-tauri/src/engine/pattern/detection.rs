use crate::engine::types::*;
use super::compilation::PatternEngine;

impl PatternEngine {
    /// Detect sensitive values, skipping excluded ranges (already redacted by keywords).
    pub fn detect_with_exclusions(
        &self,
        text: &str,
        options: &AutoDetectOptions,
        excluded_ranges: &[(usize, usize)],
    ) -> Vec<Detection> {
        let mut detections: Vec<Detection> = Vec::new();
        let mut covered: Vec<(usize, usize)> = excluded_ranges.to_vec();

        for cp in &self.patterns {
            if !self.is_enabled(&cp.pattern_type, options) {
                continue;
            }

            for mat in cp.regex.find_iter(text) {
                let start = mat.start();
                let end = mat.end();

                if ranges_overlap(&covered, start, end) {
                    continue;
                }

                let classification = self.classify(mat.as_str(), &cp.pattern_type, options);
                detections.push(Detection {
                    source: DetectionSource::Pattern {
                        pattern_type: cp.pattern_type.clone(),
                        classification,
                    },
                    value: mat.as_str().to_string(),
                    start,
                    end,
                });
                covered.push((start, end));
            }
        }

        detections.sort_by_key(|d| d.start);
        detections
    }

    pub(super) fn is_enabled(&self, pattern_type: &PatternType, options: &AutoDetectOptions) -> bool {
        self.get_config(pattern_type, options).enabled
    }

}
