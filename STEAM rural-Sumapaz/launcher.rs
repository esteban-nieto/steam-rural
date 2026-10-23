#![windows_subsystem = "windows"]

use std::{
    ffi::OsStr,
    os::windows::ffi::OsStrExt,
    path::{Path, PathBuf},
    process::Command,
};

#[link(name = "user32")]
unsafe extern "system" {
    fn MessageBoxW(
        window: *mut std::ffi::c_void,
        text: *const u16,
        caption: *const u16,
        kind: u32,
    ) -> i32;
}

fn show_error(message: &str) {
    let text: Vec<u16> = OsStr::new(message).encode_wide().chain(Some(0)).collect();
    let caption: Vec<u16> = OsStr::new("STEAM Rural - Sumapaz")
        .encode_wide()
        .chain(Some(0))
        .collect();
    unsafe {
        MessageBoxW(std::ptr::null_mut(), text.as_ptr(), caption.as_ptr(), 0x10);
    }
}

fn installed_app() -> Option<PathBuf> {
    let output = Command::new("reg")
        .args([
            "query",
            r"HKCU\Software\edu\steam-rural",
            "/ve",
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let install_dir = stdout.lines().find_map(|line| {
        let (_, value) = line.split_once("REG_SZ")?;
        Some(PathBuf::from(value.trim().trim_matches('"')))
    })?;
    let executable = install_dir.join("app.exe");
    executable.is_file().then_some(executable)
}

fn launch(path: &Path) -> Result<(), String> {
    Command::new(path)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("No se pudo abrir {}: {error}", path.display()))
}

fn run() -> Result<(), String> {
    if let Some(executable) = installed_app() {
        return launch(&executable);
    }

    let launcher = std::env::current_exe().map_err(|error| error.to_string())?;
    let folder = launcher
        .parent()
        .ok_or_else(|| "No se encontró la carpeta del lanzador.".to_string())?;
    let installer = folder.join("Instalador STEAM rural-Sumapaz.exe");
    if !installer.is_file() {
        return Err(format!(
            "No se encontró el instalador junto a app.exe:\n{}",
            installer.display()
        ));
    }
    launch(&installer)
}

fn main() {
    if let Err(error) = run() {
        show_error(&error);
    }
}
