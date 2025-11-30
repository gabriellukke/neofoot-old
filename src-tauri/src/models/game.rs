use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::infrastructure::db::Pool;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Game {
    pub id: i64,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Game {
    pub async fn create(pool: Pool, name: String) -> Result<Game, sqlx::Error> {
        let now = Utc::now().to_rfc3339();

        let result = sqlx::query(
            "INSERT INTO games (name, created_at, updated_at) VALUES (?, ?, ?)"
        )
        .bind(&name)
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await?;

        let id = result.last_insert_rowid();

        Ok(Game {
            id,
            name,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub async fn get_all(pool: Pool) -> Result<Vec<Game>, sqlx::Error> {
        sqlx::query_as::<_, Game>("SELECT * FROM games ORDER BY updated_at DESC")
            .fetch_all(&pool)
            .await
    }

    pub async fn get_by_id(pool: Pool, id: i64) -> Result<Option<Game>, sqlx::Error> {
        sqlx::query_as::<_, Game>("SELECT * FROM games WHERE id = ?")
            .bind(id)
            .fetch_optional(&pool)
            .await
    }

    pub async fn delete(pool: Pool, id: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM games WHERE id = ?")
            .bind(id)
            .execute(&pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
