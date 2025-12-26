use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Game {
    pub id: i64,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}
