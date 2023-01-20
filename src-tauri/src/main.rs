use std::fs;
use std::env;
use async_process::Command;

#[tauri::command]
async fn remove_entry(entry_name: String) -> Result<(), String> {
    let cmd = Command::new("pass")
        .arg("rm")
        .arg(entry_name.clone())
        .output();

    match cmd.await {
        Ok(_output) => {
            println!("Removed entry '{}'", entry_name);
            Ok(())
        },

        Err(e) => {
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn get_entry(entry_name: String) -> Result<String, String> {
    let cmd = Command::new("pass").arg(entry_name).output();

    match cmd.await {
        Ok(output) => {
            let content = String::from_utf8(output.stdout)
                .expect("Could not create string");

            Ok(content)
        },

        Err(e) => {
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn list_pass_entries() -> Result<Vec<String>, String> {
    if let Ok(home_path) = env::var("HOME") {
        let entries_path = format!("{}/.password-store/", home_path);

        println!("entries_path: {}", entries_path);

        let entries = fs::read_dir(&entries_path)
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| {
                if let Ok(m) = e.metadata() {
                    m.is_file()
                }
                else {
                    false
                }
            })
            .map(|e| e
                 .path()
                 .display()
                 .to_string()
                 .replace(&entries_path, "")
                 .replace(".gpg", ""))
            .collect();

        Ok(entries)
    }
    else {
        Err("Could not get 'HOME' environment variable".to_string())
    }

}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_pass_entries,
            get_entry,
            remove_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
