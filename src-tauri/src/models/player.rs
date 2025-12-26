use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PlayerAttributes {
    Outfield {
        pace: i32,
        shooting: i32,
        passing: i32,
        dribbling: i32,
        defending: i32,
        physical: i32,
    },
    Goalkeeper {
        diving: i32,
        handling: i32,
        kicking: i32,
        reflexes: i32,
        positioning: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Player {
    pub id: i64,
    pub team_id: i64,
    pub name: String,
    pub position: String,
    pub birth_date: String,
    pub nationality: String,
    pub shirt_number: i32,
    pub overall: i32,
    #[sqlx(skip)]
    pub attributes: Option<PlayerAttributes>,
    #[sqlx(rename = "attributes")]
    pub attributes_json: String,
    pub created_at: String,
}
