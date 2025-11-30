use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::infrastructure::db::Pool;

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

impl Team {
    pub async fn create(
        pool: Pool,
        league_id: i64,
        name: String,
        short_name: String,
        stadium_name: String,
        stadium_capacity: i32,
        budget: i64,
        reputation: i32,
    ) -> Result<Team, sqlx::Error> {
        let now = Utc::now().to_rfc3339();

        let result = sqlx::query(
            "INSERT INTO teams (league_id, name, short_name, stadium_name, stadium_capacity, budget, reputation, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(league_id)
        .bind(&name)
        .bind(&short_name)
        .bind(&stadium_name)
        .bind(stadium_capacity)
        .bind(budget)
        .bind(reputation)
        .bind(&now)
        .execute(&pool)
        .await?;

        let id = result.last_insert_rowid();

        Ok(Team {
            id,
            league_id,
            name,
            short_name,
            stadium_name,
            stadium_capacity,
            budget,
            reputation,
            created_at: now,
        })
    }

    pub async fn get_by_id(pool: Pool, id: i64) -> Result<Option<Team>, sqlx::Error> {
        sqlx::query_as::<_, Team>("SELECT * FROM teams WHERE id = ?")
            .bind(id)
            .fetch_optional(&pool)
            .await
    }

    pub async fn get_by_league_id(pool: Pool, league_id: i64) -> Result<Vec<Team>, sqlx::Error> {
        sqlx::query_as::<_, Team>("SELECT * FROM teams WHERE league_id = ?")
            .bind(league_id)
            .fetch_all(&pool)
            .await
    }
}
