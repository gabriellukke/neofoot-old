use crate::infrastructure::db::Pool;
use crate::models::saved_game::{SavedGame, SavedGameWithTeamName};

pub struct SavedGameRepository;

impl SavedGameRepository {
    pub async fn create(
        pool: &Pool,
        game_id: i64,
        save_name: String,
        team_id: i64,
        current_date: String,
        season: i32,
        game_state: String,
    ) -> Result<SavedGame, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let result = sqlx::query(
            "INSERT INTO saved_games (game_id, save_name, team_id, current_date, season, game_state, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(game_id)
        .bind(&save_name)
        .bind(team_id)
        .bind(&current_date)
        .bind(season)
        .bind(&game_state)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        let id = result.last_insert_rowid();

        Ok(SavedGame {
            id,
            game_id,
            save_name,
            team_id,
            current_date,
            season,
            game_state,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub async fn update(
        pool: &Pool,
        id: i64,
        current_date: String,
        season: i32,
        game_state: String,
    ) -> Result<bool, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        let result = sqlx::query(
            "UPDATE saved_games
             SET current_date = ?, season = ?, game_state = ?, updated_at = ?
             WHERE id = ?"
        )
        .bind(&current_date)
        .bind(season)
        .bind(&game_state)
        .bind(&now)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn find_by_id(pool: &Pool, id: i64) -> Result<Option<SavedGame>, sqlx::Error> {
        sqlx::query_as::<_, SavedGame>("SELECT * FROM saved_games WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_game_id(
        pool: &Pool,
        game_id: i64,
    ) -> Result<Vec<SavedGameWithTeamName>, sqlx::Error> {
        sqlx::query_as::<_, SavedGameWithTeamName>(
            "SELECT
                s.id, s.game_id, s.save_name, s.team_id, t.name as team_name,
                s.current_date, s.season, s.created_at, s.updated_at
             FROM saved_games s
             INNER JOIN teams t ON s.team_id = t.id
             WHERE s.game_id = ?
             ORDER BY s.updated_at DESC"
        )
        .bind(game_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_latest_by_game_id(
        pool: &Pool,
        game_id: i64,
    ) -> Result<Option<SavedGameWithTeamName>, sqlx::Error> {
        sqlx::query_as::<_, SavedGameWithTeamName>(
            "SELECT
                s.id, s.game_id, s.save_name, s.team_id, t.name as team_name,
                s.current_date, s.season, s.created_at, s.updated_at
             FROM saved_games s
             INNER JOIN teams t ON s.team_id = t.id
             WHERE s.game_id = ?
             ORDER BY s.updated_at DESC
             LIMIT 1"
        )
        .bind(game_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn delete(pool: &Pool, id: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM saved_games WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete_all_by_game_id(pool: &Pool, game_id: i64) -> Result<u64, sqlx::Error> {
        let result = sqlx::query("DELETE FROM saved_games WHERE game_id = ?")
            .bind(game_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected())
    }
}
