use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SavedGame {
    pub id: i64,
    pub game_id: i64,
    pub save_name: String,
    pub team_id: i64,
    pub current_date: String,
    pub season: i32,
    pub game_state: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SavedGameWithTeamName {
    pub id: i64,
    pub game_id: i64,
    pub save_name: String,
    pub team_id: i64,
    pub team_name: String,
    pub current_date: String,
    pub season: i32,
    pub created_at: String,
    pub updated_at: String,
}

