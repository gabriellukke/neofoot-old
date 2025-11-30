CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    division INTEGER NOT NULL,
    season INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    stadium_name TEXT NOT NULL,
    stadium_capacity INTEGER NOT NULL,
    budget INTEGER NOT NULL,
    reputation INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL CHECK(position IN ('GK', 'DEF', 'MID', 'FWD')),
    birth_date TEXT NOT NULL,
    nationality TEXT NOT NULL,
    shirt_number INTEGER NOT NULL,
    overall INTEGER NOT NULL CHECK(overall >= 0 AND overall <= 100),
    attributes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leagues_game_id ON leagues(game_id);
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
