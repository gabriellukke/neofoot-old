use crate::infrastructure::db::Pool;
use crate::models::league::League;

pub struct LeagueRepository;

impl LeagueRepository {
    pub async fn create(
        pool: &Pool,
        game_id: i64,
        name: String,
        country: String,
        division: i32,
        season: i32,
    ) -> Result<League, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

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
        .execute(pool)
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

    pub async fn find_by_game_id(pool: &Pool, game_id: i64) -> Result<Vec<League>, sqlx::Error> {
        sqlx::query_as::<_, League>("SELECT * FROM leagues WHERE game_id = ?")
            .bind(game_id)
            .fetch_all(pool)
            .await
    }

    pub async fn find_by_id(pool: &Pool, id: i64) -> Result<Option<League>, sqlx::Error> {
        sqlx::query_as::<_, League>("SELECT * FROM leagues WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_country(pool: &Pool, game_id: i64, country: String) -> Result<Vec<League>, sqlx::Error> {
        sqlx::query_as::<_, League>(
            "SELECT * FROM leagues WHERE game_id = ? AND country = ?"
        )
        .bind(game_id)
        .bind(country)
        .fetch_all(pool)
        .await
    }

    pub async fn update(
        pool: &Pool,
        id: i64,
        name: String,
        country: String,
        division: i32,
        season: i32,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            "UPDATE leagues
             SET name = ?, country = ?, division = ?, season = ?
             WHERE id = ?"
        )
        .bind(&name)
        .bind(&country)
        .bind(division)
        .bind(season)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(pool: &Pool, id: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM leagues WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
