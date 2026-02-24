mod commands;
mod engine;
mod error;
mod keywords;
mod session;

use commands::AppState;
use engine::pipeline::Pipeline;
use session::manager::SessionManager;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_dir = dirs::config_dir()
        .unwrap_or_default()
        .join("redactly");

    let keywords_path = config_dir.join("keywords.json");
    let auto_detect_path = config_dir.join("auto-detect.json");

    let categories = keywords::store::load_keywords(&keywords_path).unwrap_or_default();
    let auto_detect_config =
        keywords::auto_detect_store::load_auto_detect_config(&auto_detect_path)
            .unwrap_or_default();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(AppState {
            session: Mutex::new(SessionManager::new()),
            pipeline: Pipeline::new(),
            categories: Mutex::new(categories),
            keywords_path,
            auto_detect_config: Mutex::new(auto_detect_config),
            auto_detect_path,
            keyword_engine: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::redact,
            commands::restore,
            commands::get_mappings,
            commands::clear_session,
            commands::set_workspace_dir,
            commands::get_keywords,
            commands::save_keywords_cmd,
            commands::get_auto_detect_config,
            commands::save_auto_detect_config,
            commands::export_keywords_cmd,
            commands::export_mappings_cmd,
            commands::import_keywords_cmd,
            commands::remove_mapping_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
