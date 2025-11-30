use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::infrastructure::db::Pool;

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

impl League {
    pub async fn create(
        pool: Pool,
        game_id: i64,
        name: String,
        country: String,
        division: i32,
        season: i32,
    ) -> Result<League, sqlx::Error> {
        let now = Utc::now().to_rfc3339();

        let result = sqlx::query(
            "INSERT INTO leagues (game_id, name, country, division, season, created_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(game_id)
        .bind(&name)
        .bind(&country)
        .bind(division)
        .bind(season)
        .bind(&now)
        .execute(&pool)
        .await?;

        let id = result.last_insert_rowid();

        Ok(League {
            id,
            game_id,
            name,
            country,
            division,
            season,
            created_at: now,
        })
    }

    pub async fn get_by_game_id(pool: Pool, game_id: i64) -> Result<Vec<League>, sqlx::Error> {
        sqlx::query_as::<_, League>("SELECT * FROM leagues WHERE game_id = ?")
            .bind(game_id)
            .fetch_all(&pool)
            .await
    }
}
