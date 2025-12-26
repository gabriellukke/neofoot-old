use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::infrastructure::db::Pool;
use crate::models::PlayerAttributes;
use crate::repositories::{LeagueRepository, PlayerRepository, TeamRepository};

#[derive(Debug, Deserialize)]
pub struct LeagueFile {
    pub league: LeagueMetadata,
    pub teams: Vec<TeamData>,
}

#[derive(Debug, Deserialize)]
pub struct LeagueMetadata {
    pub name: String,
    pub country: String,
    pub division: i32,
    pub season: i32,
}

#[derive(Debug, Deserialize)]
pub struct TeamData {
    pub name: String,
    pub short_name: String,
    pub stadium: StadiumData,
    pub budget: i64,
    pub reputation: i32,
    pub players: Vec<PlayerData>,
}

#[derive(Debug, Deserialize)]
pub struct StadiumData {
    pub name: String,
    pub capacity: i32,
}

#[derive(Debug, Deserialize)]
pub struct PlayerData {
    pub name: String,
    pub position: String,
    pub birth_date: String,
    pub nationality: String,
    pub shirt_number: i32,
    pub overall: i32,
    pub attributes: HashMap<String, i32>,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub league_id: i64,
    pub teams_imported: usize,
    pub players_imported: usize,
}

pub async fn import_league_from_json(
    pool: Pool,
    game_id: i64,
    json_content: &str,
) -> Result<ImportResult, String> {
    let league_file: LeagueFile = serde_json::from_str(json_content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let league = LeagueRepository::create(
        &pool,
        game_id,
        league_file.league.name,
        league_file.league.country,
        league_file.league.division,
        league_file.league.season,
    )
    .await
    .map_err(|e| format!("Failed to create league: {}", e))?;

    let mut teams_count = 0;
    let mut players_count = 0;

    for team_data in league_file.teams {
        let team = TeamRepository::create(
            &pool,
            league.id,
            team_data.name,
            team_data.short_name,
            team_data.stadium.name,
            team_data.stadium.capacity,
            team_data.budget,
            team_data.reputation,
        )
        .await
        .map_err(|e| format!("Failed to create team: {}", e))?;

        teams_count += 1;

        for player_data in team_data.players {
            let attributes = if player_data.position == "GK" {
                PlayerAttributes::Goalkeeper {
                    diving: *player_data.attributes.get("diving").unwrap_or(&50),
                    handling: *player_data.attributes.get("handling").unwrap_or(&50),
                    kicking: *player_data.attributes.get("kicking").unwrap_or(&50),
                    reflexes: *player_data.attributes.get("reflexes").unwrap_or(&50),
                    positioning: *player_data.attributes.get("positioning").unwrap_or(&50),
                }
            } else {
                PlayerAttributes::Outfield {
                    pace: *player_data.attributes.get("pace").unwrap_or(&50),
                    shooting: *player_data.attributes.get("shooting").unwrap_or(&50),
                    passing: *player_data.attributes.get("passing").unwrap_or(&50),
                    dribbling: *player_data.attributes.get("dribbling").unwrap_or(&50),
                    defending: *player_data.attributes.get("defending").unwrap_or(&50),
                    physical: *player_data.attributes.get("physical").unwrap_or(&50),
                }
            };

            PlayerRepository::create(
                &pool,
                team.id,
                player_data.name,
                player_data.position,
                player_data.birth_date,
                player_data.nationality,
                player_data.shirt_number,
                player_data.overall,
                attributes,
            )
            .await
            .map_err(|e| format!("Failed to create player: {}", e))?;

            players_count += 1;
        }
    }

    Ok(ImportResult {
        league_id: league.id,
        teams_imported: teams_count,
        players_imported: players_count,
    })
}
