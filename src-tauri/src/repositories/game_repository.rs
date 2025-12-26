use crate::infrastructure::db::Pool;
use crate::models::game::Game;

pub struct GameRepository;

impl GameRepository {
    pub async fn create(pool: &Pool, name: String) -> Result<Game, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let result = sqlx::query(
            "INSERT INTO games (name, created_at, updated_at) VALUES (?, ?, ?)"
        )
        .bind(&name)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        let id = result.last_insert_rowid();

        Ok(Game {
            id,
            name,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub async fn find_all(pool: &Pool) -> Result<Vec<Game>, sqlx::Error> {
        sqlx::query_as::<_, Game>("SELECT * FROM games ORDER BY updated_at DESC")
            .fetch_all(pool)
            .await
    }

    pub async fn find_by_id(pool: &Pool, id: i64) -> Result<Option<Game>, sqlx::Error> {
        sqlx::query_as::<_, Game>("SELECT * FROM games WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn update(pool: &Pool, id: i64, name: String) -> Result<bool, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let result = sqlx::query(
            "UPDATE games SET name = ?, updated_at = ? WHERE id = ?"
        )
        .bind(&name)
        .bind(&now)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(pool: &Pool, id: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM games WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
