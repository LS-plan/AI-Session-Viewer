use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CliInstallation {
    pub path: String,
    pub version: Option<String>,
    pub cli_type: String, // "claude"
}

/// Find the Claude CLI binary path.
pub fn find_cli(_cli_type: &str) -> Result<String, String> {
    let binary_name = if cfg!(windows) {
        "claude.exe"
    } else {
        "claude"
    };

    // Try system lookup first (which/where)
    if let Some(path) = which_binary(binary_name) {
        return Ok(path);
    }

    // Try known paths
    for candidate in known_paths() {
        if candidate.exists() {
            return Ok(candidate.to_string_lossy().to_string());
        }
    }

    Err("Claude CLI not found. Please install it first.".to_string())
}

/// Discover installed Claude CLI.
pub fn discover_installations() -> Vec<CliInstallation> {
    let mut installations = Vec::new();

    if let Ok(path) = find_cli("claude") {
        let version = get_cli_version(&path);
        installations.push(CliInstallation {
            path,
            version,
            cli_type: "claude".to_string(),
        });
    }

    installations
}

/// Use `where` (Windows) or `which` (Unix) to find a binary.
fn which_binary(name: &str) -> Option<String> {
    #[cfg(windows)]
    let result = Command::new("where").arg(name).output();

    #[cfg(not(windows))]
    let result = Command::new("which").arg(name).output();

    if let Ok(output) = result {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // `where` on Windows may return multiple lines; take the first
            if let Some(first_line) = stdout.lines().next() {
                let trimmed = first_line.trim();
                if !trimmed.is_empty() {
                    return Some(trimmed.to_string());
                }
            }
        }
    }
    None
}

/// Known installation paths to check.
fn known_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    let home = dirs::home_dir();

    let binary_name = if cfg!(windows) {
        "claude.exe"
    } else {
        "claude"
    };

    if let Some(ref home) = home {
        // npm global
        if cfg!(windows) {
            paths.push(home.join("AppData/Roaming/npm").join(binary_name));
        } else {
            paths.push(home.join(".npm-global/bin").join(binary_name));
        }

        // NVM paths
        let nvm_dir = home.join(".nvm/versions/node");
        if nvm_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
                for entry in entries.flatten() {
                    paths.push(entry.path().join("bin").join(binary_name));
                }
            }
        }

        // Local bin
        paths.push(home.join(".local/bin").join(binary_name));

        // Bun global
        paths.push(home.join(".bun/bin").join(binary_name));
    }

    // System paths (Unix)
    #[cfg(not(windows))]
    {
        paths.push(PathBuf::from("/usr/local/bin").join(binary_name));
        paths.push(PathBuf::from("/opt/homebrew/bin").join(binary_name));
    }

    paths
}

/// Get CLI version by running `<cli> --version`.
fn get_cli_version(path: &str) -> Option<String> {
    let output = Command::new(path).arg("--version").output().ok()?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let version = stdout.trim().to_string();
        if version.is_empty() {
            None
        } else {
            Some(version)
        }
    } else {
        None
    }
}
