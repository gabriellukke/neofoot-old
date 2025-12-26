use crate::infrastructure::db::Pool;
use crate::models::player::{Player, PlayerAttributes};

pub struct PlayerRepository;

impl PlayerRepository {
    pub async fn create(
        pool: &Pool,
        team_id: i64,
        name: String,
        position: String,
        birth_date: String,
        nationality: String,
        shirt_number: i32,
        overall: i32,
        attributes: PlayerAttributes,
    ) -> Result<Player, sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();
        let attributes_json = serde_json::to_string(&attributes).unwrap();

        let result = sqlx::query(
            "INSERT INTO players (team_id, name, position, birth_date, nationality, shirt_number, overall, attributes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(team_id)
        .bind(&name)
        .bind(&position)
        .bind(&birth_date)
        .bind(&nationality)
        .bind(shirt_number)
        .bind(overall)
        .bind(&attributes_json)
        .bind(&now)
        .execute(pool)
        .await?;

        let id = result.last_insert_rowid();

        Ok(Player {
            id,
            team_id,
            name,
            position,
            birth_date,
            nationality,
            shirt_number,
            overall,
            attributes: Some(attributes),
            attributes_json,
            created_at: now,
        })
    }

    pub async fn find_by_team_id(pool: &Pool, team_id: i64) -> Result<Vec<Player>, sqlx::Error> {
        let mut players = sqlx::query_as::<_, Player>("SELECT * FROM players WHERE team_id = ?")
            .bind(team_id)
            .fetch_all(pool)
            .await?;

        for player in &mut players {
            player.attributes = serde_json::from_str(&player.attributes_json).ok();
        }

        Ok(players)
    }

    pub async fn find_by_id(pool: &Pool, id: i64) -> Result<Option<Player>, sqlx::Error> {
        let mut player = sqlx::query_as::<_, Player>("SELECT * FROM players WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        if let Some(ref mut p) = player {
            p.attributes = serde_json::from_str(&p.attributes_json).ok();
        }

        Ok(player)
    }

    pub async fn find_by_position(
        pool: &Pool,
        team_id: i64,
        position: String,
    ) -> Result<Vec<Player>, sqlx::Error> {
        let mut players = sqlx::query_as::<_, Player>(
            "SELECT * FROM players WHERE team_id = ? AND position = ?"
        )
        .bind(team_id)
        .bind(position)
        .fetch_all(pool)
        .await?;

        for player in &mut players {
            player.attributes = serde_json::from_str(&player.attributes_json).ok();
        }

        Ok(players)
    }

    pub async fn update(
        pool: &Pool,
        id: i64,
        name: String,
        position: String,
        shirt_number: i32,
        overall: i32,
        attributes: PlayerAttributes,
    ) -> Result<bool, sqlx::Error> {
        let attributes_json = serde_json::to_string(&attributes).unwrap();

        let result = sqlx::query(
            "UPDATE players
             SET name = ?, position = ?, shirt_number = ?, overall = ?, attributes = ?
             WHERE id = ?"
        )
        .bind(&name)
        .bind(&position)
        .bind(shirt_number)
        .bind(overall)
        .bind(&attributes_json)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(pool: &Pool, id: i64) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM players WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
