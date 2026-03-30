use tauri::{AppHandle, Manager};

/// Invoked by the splash screen once the progress bar completes.
/// Closes the splash window and shows the main application window.
#[tauri::command]
fn close_splash_open_main(app: AppHandle) -> Result<(), String> {
    // Show the main window first so there's no blank-screen flash
    if let Some(main) = app.get_webview_window("main") {
        main.show().map_err(|e| e.to_string())?;
        main.set_focus().map_err(|e| e.to_string())?;
    }
    // Then close the splash window
    if let Some(splash) = app.get_webview_window("splash") {
        splash.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
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
        .invoke_handler(tauri::generate_handler![close_splash_open_main])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
