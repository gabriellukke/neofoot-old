use crate::infrastructure::db::Pool;
use crate::models::team::Team;

pub struct TeamRepository;

impl TeamRepository {
    pub async fn create(
        pool: &Pool,
        league_id: i64,
        name: String,
        short_name: String,
        stadium_name: String,
        stadium_capacity: i32,
        budget: i64,
        reputation: i32,
    ) -> Result<Team, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

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
        .execute(pool)
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

    pub async fn find_by_id(pool: &Pool, id: i64) -> Result<Option<Team>, sqlx::Error> {
        sqlx::query_as::<_, Team>("SELECT * FROM teams WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_league_id(pool: &Pool, league_id: i64) -> Result<Vec<Team>, sqlx::Error> {
        sqlx::query_as::<_, Team>("SELECT * FROM teams WHERE league_id = ?")
            .bind(league_id)
            .fetch_all(pool)
            .await
    }

    pub async fn find_by_name(pool: &Pool, name: String) -> Result<Option<Team>, sqlx::Error> {
        sqlx::query_as::<_, Team>("SELECT * FROM teams WHERE name = ?")
            .bind(name)
            .fetch_optional(pool)
            .await
    }

    pub async fn update(
        pool: &Pool,
        id: i64,
        name: String,
        short_name: String,
        stadium_name: String,
        stadium_capacity: i32,
        budget: i64,
        reputation: i32,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            "UPDATE teams
             SET name = ?, short_name = ?, stadium_name = ?, stadium_capacity = ?, budget = ?, reputation = ?
             WHERE id = ?"
        )
        .bind(&name)
        .bind(&short_name)
        .bind(&stadium_name)
        .bind(stadium_capacity)
        .bind(budget)
        .bind(reputation)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn update_budget(pool: &Pool, id: i64, budget: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("UPDATE teams SET budget = ? WHERE id = ?")
            .bind(budget)
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn update_reputation(pool: &Pool, id: i64, reputation: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("UPDATE teams SET reputation = ? WHERE id = ?")
            .bind(reputation)
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(pool: &Pool, id: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM teams WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
