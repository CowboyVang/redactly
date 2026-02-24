import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type {
  RedactionResult,
  RedactOptions,
  RedactionMapping,
} from "../types";
import { DEFAULT_AUTO_DETECT_CONFIG } from "../constants";

const DEFAULT_OPTIONS: RedactOptions = {
  auto_detect: DEFAULT_AUTO_DETECT_CONFIG,
};

export function useRedact() {
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [mappings, setMappings] = useState<RedactionMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redact(
    text: string,
    options?: Partial<RedactOptions>,
  ): Promise<RedactionResult | null> {
    setLoading(true);
    setError(null);
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const res = await invoke<RedactionResult>("redact", {
        text,
        options: opts,
      });
      setResult(res);
      const allMappings = await invoke<RedactionMapping[]>("get_mappings");
      setMappings(allMappings);
      return res;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function restore(text: string): Promise<string | null> {
    setLoading(true);
    setError(null);
    try {
      const restored = await invoke<string>("restore", { text });
      return restored;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function clearSession() {
    try {
      await invoke("clear_session");
      setMappings([]);
      setResult(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function openWorkspaceDir(dir: string) {
    try {
      const loaded = await invoke<RedactionMapping[]>("set_workspace_dir", {
        dir,
      });
      setMappings(loaded);
    } catch (e) {
      setError(String(e));
    }
  }

  async function removeMapping(index: number) {
    try {
      const updated = await invoke<RedactionMapping[]>("remove_mapping_cmd", { index });
      setMappings(updated);
    } catch (e) {
      setError(String(e));
    }
  }

  async function exportMappings() {
    const path = await save({
      defaultPath: "redactly-mappings.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (path) {
      await invoke("export_mappings_cmd", { path });
    }
  }

  return {
    result,
    mappings,
    loading,
    error,
    redact,
    restore,
    clearSession,
    openWorkspaceDir,
    removeMapping,
    exportMappings,
  };
}
