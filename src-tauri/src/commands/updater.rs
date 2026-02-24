use tauri::command;

/// Detect whether the app is running as an installed version or portable version.
/// - Windows: check if an NSIS uninstaller exists next to the exe → "installed", otherwise "portable"
/// - macOS/Linux: always "installed" (no portable distribution)
#[command]
pub fn get_install_type() -> String {
    #[cfg(target_os = "windows")]
    {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(dir) = exe_path.parent() {
                let uninstaller = dir.join("uninstall.exe");
                if uninstaller.exists() {
                    return "installed".to_string();
                }
            }
        }
        "portable".to_string()
    }
    #[cfg(not(target_os = "windows"))]
    {
        "installed".to_string()
    }
}
