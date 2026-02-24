import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { KeywordCategory } from "../types";

export function useKeywords() {
  const [categories, setCategories] = useState<KeywordCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<KeywordCategory[]>("get_keywords")
      .then(setCategories)
      .catch((err) => console.error("Failed to load keywords:", err))
      .finally(() => setLoading(false));
  }, []);

  async function saveCategories(updated: KeywordCategory[]) {
    await invoke("save_keywords_cmd", { categories: updated });
    setCategories(updated);
  }

  function addCategory(name: string) {
    const updated = [...categories, { name, keywords: [] }];
    saveCategories(updated);
  }

  function removeCategory(index: number) {
    const updated = categories.filter((_, i) => i !== index);
    saveCategories(updated);
  }

  function addKeyword(categoryIndex: number, term: string) {
    const updated = [...categories];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      keywords: [
        ...updated[categoryIndex].keywords,
        { term, variants: true, fuzzy: "Off" as const },
      ],
    };
    saveCategories(updated);
  }

  function removeKeyword(categoryIndex: number, keywordIndex: number) {
    const updated = [...categories];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      keywords: updated[categoryIndex].keywords.filter(
        (_, i) => i !== keywordIndex,
      ),
    };
    saveCategories(updated);
  }

  async function importCategories() {
    const path = await open({
      filters: [{ name: "JSON", extensions: ["json"] }],
      multiple: false,
    });
    if (path) {
      const merged = await invoke<KeywordCategory[]>("import_keywords_cmd", { path });
      setCategories(merged);
    }
  }

  async function exportCategories() {
    const path = await save({
      defaultPath: "redactly-keywords.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (path) {
      await invoke("export_keywords_cmd", { path });
    }
  }

  return {
    categories,
    loading,
    addCategory,
    removeCategory,
    addKeyword,
    removeKeyword,
    saveCategories,
    importCategories,
    exportCategories,
  };
}
