CREATE TABLE IF NOT EXISTS saved_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    save_name TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    current_date TEXT NOT NULL,
    season INTEGER NOT NULL,
    game_state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_games_game_id ON saved_games(game_id);
CREATE INDEX IF NOT EXISTS idx_saved_games_updated_at ON saved_games(updated_at);

