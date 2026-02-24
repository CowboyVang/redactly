use crate::engine::types::*;
use super::compilation::PatternEngine;

impl PatternEngine {
    /// Classify a detected value using user-defined rules for its pattern type.
    pub fn classify(
        &self,
        value: &str,
        pattern_type: &PatternType,
        options: &AutoDetectOptions,
    ) -> Option<String> {
        let config = self.get_config(pattern_type, options);
        for rule in &config.rules {
            let matched = match pattern_type {
                PatternType::Email => {
                    value
                        .rsplit_once('@')
                        .map(|(_, domain)| {
                            let d = domain.to_lowercase();
                            let p = rule.pattern.to_lowercase();
                            d == p || d.ends_with(&format!(".{}", p))
                        })
                        .unwrap_or(false)
                }
                PatternType::Ip => Self::ip_matches(value, &rule.pattern),
                PatternType::Hostname => {
                    let v = value.to_lowercase();
                    let p = rule.pattern.to_lowercase();
                    v == p || v.ends_with(&p)
                }
                PatternType::Path => value.starts_with(&rule.pattern),
                PatternType::Username => value.eq_ignore_ascii_case(&rule.pattern),
                PatternType::Mac => value.eq_ignore_ascii_case(&rule.pattern),
                PatternType::Phone => {
                    let v_digits: String = value.chars().filter(|c| c.is_ascii_digit()).collect();
                    let p_digits: String = rule.pattern.chars().filter(|c| c.is_ascii_digit()).collect();
                    v_digits.starts_with(&p_digits) || v_digits.ends_with(&p_digits)
                }
                PatternType::Url => {
                    let v = value.to_lowercase();
                    let p = rule.pattern.to_lowercase();
                    v.contains(&p)
                }
            };
            if matched {
                return Some(rule.label.clone());
            }
        }
        None
    }

    pub(super) fn get_config<'a>(
        &self,
        pattern_type: &PatternType,
        options: &'a AutoDetectOptions,
    ) -> &'a PatternConfig {
        match pattern_type {
            PatternType::Email => &options.email,
            PatternType::Ip => &options.ip,
            PatternType::Hostname => &options.hostname,
            PatternType::Path => &options.path,
            PatternType::Username => &options.username,
            PatternType::Mac => &options.mac,
            PatternType::Phone => &options.phone,
            PatternType::Url => &options.url,
        }
    }

    /// Check if an IP address matches a CIDR or prefix string.
    fn ip_matches(ip_str: &str, rule_pattern: &str) -> bool {
        if let Some((network_str, prefix_str)) = rule_pattern.split_once('/') {
            if let (Some(ip), Some(network), Ok(prefix_len)) = (
                Self::parse_ipv4(ip_str),
                Self::parse_ipv4(network_str),
                prefix_str.parse::<u32>(),
            ) {
                if prefix_len > 32 {
                    return false;
                }
                let mask = if prefix_len == 0 { 0u32 } else { !0u32 << (32 - prefix_len) };
                return (ip & mask) == (network & mask);
            }
            false
        } else {
            ip_str.starts_with(rule_pattern)
        }
    }

    fn parse_ipv4(s: &str) -> Option<u32> {
        let parts: Vec<&str> = s.split('.').collect();
        if parts.len() != 4 {
            return None;
        }
        let mut result: u32 = 0;
        for part in parts {
            let octet: u32 = part.parse().ok()?;
            if octet > 255 {
                return None;
            }
            result = (result << 8) | octet;
        }
        Some(result)
    }
}
