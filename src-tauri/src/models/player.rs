use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::infrastructure::db::Pool;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PlayerAttributes {
    Outfield {
        pace: i32,
        shooting: i32,
        passing: i32,
        dribbling: i32,
        defending: i32,
        physical: i32,
    },
    Goalkeeper {
        diving: i32,
        handling: i32,
        kicking: i32,
        reflexes: i32,
        positioning: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Player {
    pub id: i64,
    pub team_id: i64,
    pub name: String,
    pub position: String,
    pub birth_date: String,
    pub nationality: String,
    pub shirt_number: i32,
    pub overall: i32,
    #[sqlx(skip)]
    pub attributes: Option<PlayerAttributes>,
    #[sqlx(rename = "attributes")]
    pub attributes_json: String,
    pub created_at: String,
}

impl Player {
    pub async fn create(
        pool: Pool,
        team_id: i64,
        name: String,
        position: String,
        birth_date: String,
        nationality: String,
        shirt_number: i32,
        overall: i32,
        attributes: PlayerAttributes,
    ) -> Result<Player, sqlx::Error> {
        let now = Utc::now().to_rfc3339();
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
        .execute(&pool)
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

    pub async fn get_by_team_id(pool: Pool, team_id: i64) -> Result<Vec<Player>, sqlx::Error> {
        let mut players = sqlx::query_as::<_, Player>("SELECT * FROM players WHERE team_id = ?")
            .bind(team_id)
            .fetch_all(&pool)
            .await?;

        for player in &mut players {
            player.attributes = serde_json::from_str(&player.attributes_json).ok();
        }

        Ok(players)
    }
}
