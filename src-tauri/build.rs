fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&[
                "redact",
                "restore",
                "get_mappings",
                "clear_session",
                "set_workspace_dir",
                "get_keywords",
                "save_keywords_cmd",
                "get_auto_detect_config",
                "save_auto_detect_config",
            ]),
        ),
    )
    .unwrap();
}
