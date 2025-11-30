-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
