use sqlx::{sqlite::SqlitePoolOptions, migrate::MigrateDatabase, Sqlite};
use std::time::Duration;

pub type Pool = sqlx::SqlitePool;

/// Initialize the database pool and run migrations
pub async fn init_pool(db_url: &str) -> Pool {
    // Create database file if it doesn't exist
    if !Sqlite::database_exists(db_url).await.unwrap_or(false) {
        println!("Creating database {}", db_url);
        Sqlite::create_database(db_url)
            .await
            .expect("Failed to create database");
    }

    // Connect to database
    let pool = SqlitePoolOptions::new()
        .acquire_timeout(Duration::from_secs(5))
        .max_connections(5)
        .connect(db_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    println!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    println!("Database initialized successfully");
    pool
}
