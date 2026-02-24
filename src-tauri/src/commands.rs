use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::engine::keyword::KeywordEngine;
use crate::engine::pipeline::Pipeline;
use crate::engine::types::*;
use crate::error::AppError;
use crate::keywords::{auto_detect_store, store};
use crate::session::manager::SessionManager;
use crate::session::storage;
use std::path::Path;

pub struct AppState {
    pub session: Mutex<SessionManager>,
    pub pipeline: Pipeline,
    pub categories: Mutex<Vec<KeywordCategory>>,
    pub keywords_path: PathBuf,
    pub auto_detect_config: Mutex<AutoDetectOptions>,
    pub auto_detect_path: PathBuf,
    pub keyword_engine: Mutex<Option<KeywordEngine>>,
}

fn lock_state<T>(mutex: &Mutex<T>) -> Result<std::sync::MutexGuard<'_, T>, AppError> {
    mutex.lock().map_err(|e| AppError::Lock(e.to_string()))
}

#[tauri::command]
pub fn redact(
    text: String,
    options: RedactOptions,
    state: State<'_, AppState>,
) -> Result<RedactionResult, AppError> {
    let categories = lock_state(&state.categories)?;

    let mut engine_cache = lock_state(&state.keyword_engine)?;
    if engine_cache.is_none() {
        *engine_cache = Some(KeywordEngine::new(&categories));
    }
    let result = state
        .pipeline
        .redact_with_engine(&text, engine_cache.as_ref().unwrap(), &options);
    drop(engine_cache);

    let mut session = lock_state(&state.session)?;
    session.add_mappings(result.mappings.clone());

    if let Some(dir) = session.workspace_dir() {
        let _ = storage::save_session(dir, session.mappings());
    }

    Ok(result)
}

#[tauri::command]
pub fn restore(text: String, state: State<'_, AppState>) -> Result<String, AppError> {
    let session = lock_state(&state.session)?;
    Ok(state.pipeline.restore(&text, session.mappings()))
}

#[tauri::command]
pub fn get_mappings(state: State<'_, AppState>) -> Result<Vec<RedactionMapping>, AppError> {
    let session = lock_state(&state.session)?;
    Ok(session.mappings().to_vec())
}

#[tauri::command]
pub fn clear_session(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut session = lock_state(&state.session)?;
    session.clear();
    Ok(())
}

#[tauri::command]
pub fn set_workspace_dir(dir: String, state: State<'_, AppState>) -> Result<Vec<RedactionMapping>, AppError> {
    let path = PathBuf::from(&dir);
    let mut session = lock_state(&state.session)?;
    session.set_workspace_dir(path.clone());

    let mappings = storage::load_session(&path)?;
    if !mappings.is_empty() {
        session.add_mappings(mappings);
    }
    Ok(session.mappings().to_vec())
}

#[tauri::command]
pub fn get_keywords(state: State<'_, AppState>) -> Result<Vec<KeywordCategory>, AppError> {
    let categories = lock_state(&state.categories)?;
    Ok(categories.clone())
}

#[tauri::command]
pub fn save_keywords_cmd(
    categories: Vec<KeywordCategory>,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    store::save_keywords(&state.keywords_path, &categories)?;
    let mut stored = lock_state(&state.categories)?;
    *stored = categories;
    drop(stored);

    let mut engine_cache = lock_state(&state.keyword_engine)?;
    *engine_cache = None;
    Ok(())
}

#[tauri::command]
pub fn get_auto_detect_config(
    state: State<'_, AppState>,
) -> Result<AutoDetectOptions, AppError> {
    let config = lock_state(&state.auto_detect_config)?;
    Ok(config.clone())
}

#[tauri::command]
pub fn save_auto_detect_config(
    config: AutoDetectOptions,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    auto_detect_store::save_auto_detect_config(&state.auto_detect_path, &config)?;
    let mut stored = lock_state(&state.auto_detect_config)?;
    *stored = config;
    Ok(())
}

#[tauri::command]
pub fn export_keywords_cmd(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let categories = lock_state(&state.categories)?;
    store::export_keywords(Path::new(&path), &categories)
}

#[tauri::command]
pub fn remove_mapping_cmd(index: usize, state: State<'_, AppState>) -> Result<Vec<RedactionMapping>, AppError> {
    let mut session = lock_state(&state.session)?;
    session.remove_mapping(index);
    let mappings = session.mappings().to_vec();
    if let Some(dir) = session.workspace_dir() {
        let _ = storage::save_session(dir, &mappings);
    }
    Ok(mappings)
}

#[tauri::command]
pub fn import_keywords_cmd(path: String, state: State<'_, AppState>) -> Result<Vec<KeywordCategory>, AppError> {
    let imported = store::load_keywords(Path::new(&path))?;
    let mut stored = lock_state(&state.categories)?;
    let merged = store::merge_keywords(&stored, &imported);
    *stored = merged.clone();
    drop(stored);
    store::save_keywords(&state.keywords_path, &merged)?;
    let mut engine_cache = lock_state(&state.keyword_engine)?;
    *engine_cache = None;
    Ok(merged)
}

#[tauri::command]
pub fn export_mappings_cmd(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let session = lock_state(&state.session)?;
    storage::export_session(Path::new(&path), session.mappings())
}
