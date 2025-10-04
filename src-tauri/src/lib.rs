use serde_json::json;
use tauri::{Manager, RunEvent};
use tauri_plugin_log::log;
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../init.sql"),
            kind: MigrationKind::Up,
        }
    ];

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
            .level(log::LevelFilter::Info)
            .build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let store = app.store("settings.json")?;
            store.set("api_base", json!("http://localhost:8000"));
            store.save()?;

            let salt_path = app.handle()
                .path().app_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");
            app.handle().plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            Ok(())
        })
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:main.db", migrations)
            .build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(move |_app_handle, _event| {
        #[cfg(all(desktop, not(test)))]
        match &_event {
            RunEvent::ExitRequested { api, code, .. } => {
                if code.is_none() {
                    api.prevent_exit();
                }
            }
            RunEvent::WindowEvent {
                event: tauri::WindowEvent::CloseRequested { api, .. },
                label,
                ..
            } => {
                api.prevent_close();
                _app_handle
                    .get_webview_window(&label)
                    .unwrap()
                    .hide()
                    .unwrap();
            }
            _ => (),
        }
    })
}
