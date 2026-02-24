import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AutoDetectOptions, ClassificationRule } from "../types";
import { DEFAULT_AUTO_DETECT_CONFIG, type PatternKey } from "../constants";

export function useAutoDetect() {
  const [config, setConfig] = useState<AutoDetectOptions>(DEFAULT_AUTO_DETECT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<AutoDetectOptions>("get_auto_detect_config")
      .then(setConfig)
      .catch((err) => console.error("Failed to load auto-detect config:", err))
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig(updated: AutoDetectOptions) {
    setConfig(updated);
    try {
      await invoke("save_auto_detect_config", { config: updated });
    } catch (err) {
      console.error("Failed to save auto-detect config:", err);
    }
  }

  function togglePattern(key: PatternKey) {
    const updated: AutoDetectOptions = {
      ...config,
      [key]: { ...config[key], enabled: !config[key].enabled },
    };
    saveConfig(updated);
  }

  function addRule(key: PatternKey, rule: ClassificationRule) {
    const patternConfig = config[key];
    const updated: AutoDetectOptions = {
      ...config,
      [key]: {
        ...patternConfig,
        rules: [...patternConfig.rules, rule],
      },
    };
    saveConfig(updated);
  }

  function removeRule(key: PatternKey, ruleIndex: number) {
    const patternConfig = config[key];
    const updated: AutoDetectOptions = {
      ...config,
      [key]: {
        ...patternConfig,
        rules: patternConfig.rules.filter((_, i) => i !== ruleIndex),
      },
    };
    saveConfig(updated);
  }

  return {
    config,
    loading,
    togglePattern,
    addRule,
    removeRule,
  };
}
