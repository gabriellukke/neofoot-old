mod infrastructure;
mod models;

use infrastructure::{db, league_importer};
use models::{Game, League, Player, Team};
use tauri::{Manager, State};

struct AppState {
    db: db::Pool,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn create_game(state: State<'_, AppState>, name: String) -> Result<Game, String> {
    Game::create(state.db.clone(), name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_games(state: State<'_, AppState>) -> Result<Vec<Game>, String> {
    Game::get_all(state.db.clone())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_game(state: State<'_, AppState>, id: i64) -> Result<Option<Game>, String> {
    Game::get_by_id(state.db.clone(), id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_game(state: State<'_, AppState>, id: i64) -> Result<bool, String> {
    Game::delete(state.db.clone(), id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn import_league(
    state: State<'_, AppState>,
    game_id: i64,
    json_content: String,
) -> Result<league_importer::ImportResult, String> {
    league_importer::import_league_from_json(state.db.clone(), game_id, &json_content).await
}

#[tauri::command]
async fn get_leagues(state: State<'_, AppState>, game_id: i64) -> Result<Vec<League>, String> {
    League::get_by_game_id(state.db.clone(), game_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_league(state: State<'_, AppState>, league_id: i64) -> Result<Option<League>, String> {
    League::get_by_id(state.db.clone(), league_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_league(state: State<'_, AppState>, league_id: i64) -> Result<bool, String> {
    League::delete(state.db.clone(), league_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_team(state: State<'_, AppState>, team_id: i64) -> Result<Option<Team>, String> {
    Team::get_by_id(state.db.clone(), team_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_teams(state: State<'_, AppState>, league_id: i64) -> Result<Vec<Team>, String> {
    Team::get_by_league_id(state.db.clone(), league_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_players(state: State<'_, AppState>, team_id: i64) -> Result<Vec<Player>, String> {
    Player::get_by_team_id(state.db.clone(), team_id)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");

            let db_path = app_dir.join("neofoot.db");
            let db_url = format!("sqlite://{}", db_path.display());

            let db_pool = tauri::async_runtime::block_on(async {
                db::init_pool(&db_url).await
            });

            app.manage(AppState { db: db_pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_game,
            get_all_games,
            get_game,
            delete_game,
            import_league,
            get_leagues,
            get_league,
            delete_league,
            get_team,
            get_teams,
            get_players
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
