use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct League {
    pub id: i64,
    pub game_id: i64,
    pub name: String,
    pub country: String,
    pub division: i32,
    pub season: i32,
    pub created_at: String,
}
