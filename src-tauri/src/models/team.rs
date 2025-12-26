use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Team {
    pub id: i64,
    pub league_id: i64,
    pub name: String,
    pub short_name: String,
    pub stadium_name: String,
    pub stadium_capacity: i32,
    pub budget: i64,
    pub reputation: i32,
    pub created_at: String,
}
