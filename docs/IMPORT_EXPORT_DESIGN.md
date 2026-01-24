# Import/Export System Design

## Overview

This document describes the normalized, ID-based import/export system for Neofoot. The system uses ZIP packages containing structured JSON files with stable codes, UUID-based IDs, validation, preview, and duplicate detection capabilities.

## Core Principles

1. **Normalized Entity Model**: Competition → Season → Division → Participation (not nested structures)
2. **Global Entities**: Teams and Players are never duplicated across divisions or seasons
3. **UUID-based IDs**: Internal database uses UUIDs to prevent collisions
4. **Human-Readable Codes**: User-facing identifiers (e.g., `BR_FLA`, `BR_BRASILEIRAO_2025`)
5. **Forward References Only**: Relationships validated through forward refs, no reverse arrays
6. **Single Source of Truth**: Each relationship has one authoritative field
7. **Computed Fingerprints**: Fingerprints calculated on import, not stored in JSON
8. **Duplicate Detection**: Fingerprint-based detection with user choice for resolution
9. **Validation → Preview → Apply**: Mandatory three-phase import process
10. **Fully Editable**: All imported data can be edited in-game
11. **Forward Compatible**: Unknown files ignored with warnings

## Entity Model

### Entity Hierarchy

```
Competition (code: BR_BRASILEIRAO)
  └─ Season (code: BR_BRASILEIRAO_2025)
      ├─ Division 1 (code: BR_BRASILEIRAO_2025_D1)
      │   ├─ Participation (code: BR_BRASILEIRAO_2025_D1__BR_FLA)
      │   ├─ Participation (code: BR_BRASILEIRAO_2025_D1__BR_PAL)
      │   └─ ...
      ├─ Division 2 (code: BR_BRASILEIRAO_2025_D2)
      │   ├─ Participation (code: BR_BRASILEIRAO_2025_D2__BR_CRU)
      │   └─ ...
      └─ ...

Teams (global, not duplicated)
  ├─ Flamengo (code: BR_FLA)
  ├─ Palmeiras (code: BR_PAL)
  └─ ...

Players (global, not duplicated)
  ├─ Gabriel Barbosa (code: BR_GABRIEL_BARBOSA_1996_08_30, contract: BR_FLA)
  ├─ Endrick (code: BR_ENDRICK_2006_07_21, contract: BR_PAL)
  └─ ...
```

### Key Concepts

- **Competition**: The identity of a league system (e.g., "Campeonato Brasileiro", "Premier League")
- **Season**: A specific year/edition of a competition (e.g., 2025)
- **Division**: A tier within a season (e.g., Série A = Division 1, Série B = Division 2)
- **Participation**: Links a team to a specific division in a specific season
- **Team**: Global entity, can participate in different divisions across seasons
- **Player**: Global entity, has a contract with one team at a time
- **Code**: Human-readable, deterministic identifier (e.g., `BR_FLA`)
- **UUID**: Internal database identifier, prevents collisions

### ID vs Code

**UUID (Internal Database ID)**:
- Auto-generated on first import
- Never changes
- Prevents collisions
- Not visible to users
- Used for foreign keys in database

**Code (Human-Readable Identifier)**:
- Defined in package JSON
- Deterministic and stable
- User-facing (shown in UI, file names)
- Can conflict (handled via duplicate detection)
- Not used for database foreign keys

**Example**:
```
Team in database:
  id: "550e8400-e29b-41d4-a716-446655440000" (UUID, internal)
  code: "BR_FLA" (human-readable, user-facing)
  name: "Flamengo"

Team in package JSON:
  code: "BR_FLA"
  name: "Flamengo"
  (no id field - generated on import)
```

## Package Structure

### ZIP Package Format

```
competition-package.zip
├── manifest.json
├── competitions/
│   └── BR_BRASILEIRAO.json
├── seasons/
│   └── BR_BRASILEIRAO_2025.json
├── divisions/
│   ├── BR_BRASILEIRAO_2025_D1.json
│   └── BR_BRASILEIRAO_2025_D2.json
├── participations/
│   ├── BR_BRASILEIRAO_2025_D1__BR_FLA.json
│   ├── BR_BRASILEIRAO_2025_D1__BR_PAL.json
│   └── BR_BRASILEIRAO_2025_D2__BR_CRU.json
├── teams/
│   ├── BR_FLA.json
│   ├── BR_PAL.json
│   └── BR_CRU.json
├── players/
│   ├── BR_GABRIEL_BARBOSA_1996_08_30.json
│   ├── BR_ENDRICK_2006_07_21.json
│   └── BR_RAFAEL_CABRAL_1990_05_20.json
└── (other files ignored with warnings for forward compatibility)
```

## Data Schemas

### manifest.json

Package metadata and compatibility information.

```json
{
  "name": "Campeonato Brasileiro 2025",
  "version": "1.0.0",
  "author": "Community Author",
  "description": "Brazilian football league system for 2025 season",
  "data_version": "2.0",
  "game_version": "0.2.0",
  "created_at": "2025-01-15T10:30:00Z",
  "entity_counts": {
    "competitions": 1,
    "seasons": 1,
    "divisions": 2,
    "participations": 40,
    "teams": 40,
    "players": 880
  }
}
```

**Fields:**
- `name` (required): Human-readable package name
- `version` (required): Package version (semver)
- `author` (required): Package creator
- `description` (optional): Package description
- `data_version` (required): Data schema version for compatibility
- `game_version` (required): Minimum game version required
- `created_at` (required): ISO 8601 timestamp
- `entity_counts` (optional): Summary of entities in package (not validated)

### competitions/{competition_code}.json

Competition identity (the league system itself).

```json
{
  "code": "BR_BRASILEIRAO",
  "name": "Campeonato Brasileiro",
  "country": "Brazil",
  "type": "league"
}
```

**Fields:**
- `code` (required): Stable competition code (format: `{COUNTRY}_{COMPETITION}`)
- `name` (required): Full competition name
- `country` (required): Country name
- `type` (required): Competition type enum

**Validation:**
- `code`: Unique, alphanumeric + underscores, max 50 chars
- `type`: Enum ["league", "cup", "international"]

**Relationships:**
- Seasons reference this competition via `competition_code`
- No reverse `season_codes` array (derived if needed)

### seasons/{season_code}.json

A specific year/edition of a competition.

```json
{
  "code": "BR_BRASILEIRAO_2025",
  "competition_code": "BR_BRASILEIRAO",
  "year": 2025,
  "start_date": "2025-04-01",
  "end_date": "2025-12-15"
}
```

**Fields:**
- `code` (required): Stable season code (format: `{COMPETITION_CODE}_{YEAR}`)
- `competition_code` (required): Reference to competition
- `year` (required): Season year (1900-2100)
- `start_date` (optional): Season start date (ISO 8601)
- `end_date` (optional): Season end date (ISO 8601)

**Validation:**
- `code`: Unique, must match pattern
- `competition_code`: Must exist in package
- `year`: Integer 1900-2100

**Relationships:**
- Forward ref: `competition_code` → competition (source of truth)
- No reverse `division_codes` array (derived if needed)

### divisions/{division_code}.json

A tier within a season (e.g., Division 1 = Série A).

```json
{
  "code": "BR_BRASILEIRAO_2025_D1",
  "season_code": "BR_BRASILEIRAO_2025",
  "name": "Série A",
  "tier": 1,
  "num_teams": 20,
  "promotion_slots": 0,
  "relegation_slots": 4
}
```

**Fields:**
- `code` (required): Stable division code (format: `{SEASON_CODE}_D{TIER}`)
- `season_code` (required): Reference to season
- `name` (required): Division name (e.g., "Série A", "Championship")
- `tier` (required): Division tier (1-10)
- `num_teams` (required): Expected number of teams (2-100)
- `promotion_slots` (required): Teams promoted to tier above (0-20)
- `relegation_slots` (required): Teams relegated to tier below (0-20)

**Validation:**
- `code`: Unique, must match pattern
- `season_code`: Must exist in package
- `tier`: Integer 1-10
- `num_teams`: Integer 2-100
- `promotion_slots`: Integer 0-20
- `relegation_slots`: Integer 0-20
- At import, verify count of participations matches `num_teams`

**Relationships:**
- Forward ref: `season_code` → season (source of truth)
- No reverse `participation_codes` array (derived from participations)

### participations/{participation_code}.json

Links a team to a division in a season.

```json
{
  "code": "BR_BRASILEIRAO_2025_D1__BR_FLA",
  "division_code": "BR_BRASILEIRAO_2025_D1",
  "team_code": "BR_FLA",
  "position": 1,
  "points": 0,
  "wins": 0,
  "draws": 0,
  "losses": 0,
  "goals_for": 0,
  "goals_against": 0
}
```

**Fields:**
- `code` (required): Stable participation code (format: `{DIVISION_CODE}__{TEAM_CODE}`)
  - Note: Double underscore `__` separator to avoid ambiguity
- `division_code` (required): Reference to division
- `team_code` (required): Reference to team
- `position` (optional): Current table position (1-100)
- `points` (optional): Current points (default: 0)
- `wins` (optional): Wins (default: 0)
- `draws` (optional): Draws (default: 0)
- `losses` (optional): Losses (default: 0)
- `goals_for` (optional): Goals scored (default: 0)
- `goals_against` (optional): Goals conceded (default: 0)

**Validation:**
- `code`: Unique, must match pattern `{division_code}__{team_code}`
- `division_code`: Must exist in package
- `team_code`: Must exist in package
- All numeric fields: Integer >= 0

**Relationships:**
- Forward refs: `division_code` → division, `team_code` → team (source of truth)

### teams/{team_code}.json

Global team entity (never duplicated).

```json
{
  "code": "BR_FLA",
  "name": "Flamengo",
  "short_name": "FLA",
  "founded_year": 1895,
  "city": "Rio de Janeiro",
  "country": "Brazil",
  "stadium_name": "Maracanã",
  "stadium_capacity": 78838,
  "budget": 50000000,
  "reputation": 85
}
```

**Fields:**
- `code` (required): Stable team code (format: `{COUNTRY}_{ABBREVIATION}`)
- `name` (required): Full team name
- `short_name` (required): 2-5 character abbreviation
- `founded_year` (optional): Year founded (1800-2100)
- `city` (optional): City name
- `country` (required): Country name
- `stadium_name` (required): Stadium name
- `stadium_capacity` (required): Stadium capacity (1000-200000)
- `budget` (required): Team budget (0-10000000000)
- `reputation` (required): Team reputation (0-100)

**Validation:**
- `code`: Unique, alphanumeric + underscores, max 20 chars
- `short_name`: 2-5 chars
- `founded_year`: Integer 1800-2100
- `stadium_capacity`: Integer 1000-200000
- `budget`: Integer 0-10000000000
- `reputation`: Integer 0-100

**Fingerprint (computed on import, not in JSON):**
- `normalized_name`: Lowercase, no accents, no spaces
- `country`: Country name
- `founded_year`: Year founded (optional)

**Relationships:**
- No `player_codes` array (roster derived from players' `contract_team_code`)
- Participations reference this team via `team_code`

### players/{player_code}.json

Global player entity (never duplicated).

```json
{
  "code": "BR_GABRIEL_BARBOSA_1996_08_30",
  "name": "Gabriel Barbosa",
  "position": "FWD",
  "birth_date": "1996-08-30",
  "nationality": "Brazil",
  "shirt_number": 9,
  "overall": 82,
  "contract_team_code": "BR_FLA",
  "attributes": {
    "pace": 85,
    "shooting": 84,
    "passing": 70,
    "dribbling": 78,
    "defending": 35,
    "physical": 75
  }
}
```

**For Goalkeepers (position: "GK"):**
```json
{
  "code": "BR_ROSSI_1992_02_12",
  "name": "Rossi",
  "position": "GK",
  "birth_date": "1992-02-12",
  "nationality": "Argentina",
  "shirt_number": 1,
  "overall": 78,
  "contract_team_code": "BR_FLA",
  "attributes": {
    "diving": 80,
    "handling": 78,
    "kicking": 72,
    "reflexes": 82,
    "positioning": 76
  }
}
```

**Fields:**
- `code` (required): Stable player code (format: `{COUNTRY}_{LASTNAME}_{BIRTHDATE}`)
- `name` (required): Full player name
- `position` (required): Player position enum
- `birth_date` (required): ISO date (YYYY-MM-DD)
- `nationality` (required): Country name
- `shirt_number` (required): Jersey number (1-99)
- `overall` (required): Overall rating (40-100)
- `contract_team_code` (optional): Current team code (null/omitted = free agent)
- `attributes` (required): Position-specific attributes object

**Validation:**
- `code`: Unique, alphanumeric + underscores, max 50 chars
- `position`: Enum ["GK", "DEF", "MID", "FWD"]
- `birth_date`: Valid date, player age 15-50 at import
- `shirt_number`: Integer 1-99
- `overall`: Integer 40-100
- `contract_team_code`: Must exist in package if provided
- `attributes`: All values 0-100

**Outfield Attributes (DEF/MID/FWD):**
- `pace`: 0-100
- `shooting`: 0-100
- `passing`: 0-100
- `dribbling`: 0-100
- `defending`: 0-100
- `physical`: 0-100

**Goalkeeper Attributes (GK):**
- `diving`: 0-100
- `handling`: 0-100
- `kicking`: 0-100
- `reflexes`: 0-100
- `positioning`: 0-100

**Fingerprint (computed on import, not in JSON):**
- `normalized_name`: Lowercase, no accents
- `birth_date`: ISO date
- `nationality`: Country name

**Relationships:**
- Forward ref: `contract_team_code` → team (source of truth for roster)
- Team roster is derived by querying players with matching `contract_team_code`

## Code Conventions

### Stable Code Format

Codes must be:
- Explicit and deterministic
- Unique within entity type
- URL-safe (alphanumeric + underscores only)
- Human-readable when possible
- Not auto-generated UUIDs (those are internal database IDs)

### Code Patterns

**Competition Code:**
```
{COUNTRY_CODE}_{COMPETITION_NAME}
Example: BR_BRASILEIRAO
Example: GB_PREMIER_LEAGUE
```

**Season Code:**
```
{COMPETITION_CODE}_{YEAR}
Example: BR_BRASILEIRAO_2025
Example: GB_PREMIER_LEAGUE_2024
```

**Division Code:**
```
{SEASON_CODE}_D{TIER}
Example: BR_BRASILEIRAO_2025_D1
Example: GB_PREMIER_LEAGUE_2024_D1
```

**Participation Code:**
```
{DIVISION_CODE}__{TEAM_CODE}
Example: BR_BRASILEIRAO_2025_D1__BR_FLA
Example: GB_PREMIER_LEAGUE_2024_D1__GB_ARS

Note: Double underscore (__) separator to avoid ambiguity
```

**Team Code:**
```
{COUNTRY_CODE}_{ABBREVIATION}
Example: BR_FLA (Flamengo)
Example: GB_ARS (Arsenal)
```

**Player Code:**
```
{COUNTRY_CODE}_{LASTNAME}_{BIRTHDATE}
Example: BR_GABRIEL_BARBOSA_1996_08_30

For name conflicts, append first name initials:
BR_SILVA_J_1995_03_15 (João Silva)
BR_SILVA_P_1995_03_15 (Pedro Silva)
```

## Database Schema

### Core Tables

```sql
CREATE TABLE competitions (
    id TEXT PRIMARY KEY,  -- UUID generated on import
    code TEXT UNIQUE NOT NULL,
    game_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('league', 'cup', 'international')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE seasons (
    id TEXT PRIMARY KEY,  -- UUID generated on import
    code TEXT UNIQUE NOT NULL,
    competition_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE TABLE divisions (
    id TEXT PRIMARY KEY,  -- UUID generated on import
    code TEXT UNIQUE NOT NULL,
    season_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tier INTEGER NOT NULL CHECK(tier >= 1 AND tier <= 10),
    num_teams INTEGER NOT NULL CHECK(num_teams >= 2 AND num_teams <= 100),
    promotion_slots INTEGER NOT NULL CHECK(promotion_slots >= 0 AND promotion_slots <= 20),
    relegation_slots INTEGER NOT NULL CHECK(relegation_slots >= 0 AND relegation_slots <= 20),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

CREATE TABLE participations (
    id TEXT PRIMARY KEY,  -- UUID generated on import
    code TEXT UNIQUE NOT NULL,
    division_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    position INTEGER,
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(division_id, team_id)
);

CREATE TABLE teams (
    id TEXT PRIMARY KEY,  -- UUID generated on import
    code TEXT UNIQUE NOT NULL,
    game_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    founded_year INTEGER,
    city TEXT,
    country TEXT NOT NULL,
    stadium_name TEXT NOT NULL,
    stadium_capacity INTEGER NOT NULL,
    budget INTEGER NOT NULL,
    reputation INTEGER NOT NULL,
    fingerprint_name TEXT NOT NULL,
    fingerprint_country TEXT NOT NULL,
    fingerprint_founded INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE players (
    id TEXT PRIMARY KEY,  -- UUID generated on import
    code TEXT UNIQUE NOT NULL,
    game_id INTEGER NOT NULL,
    contract_team_id TEXT,
    name TEXT NOT NULL,
    position TEXT NOT NULL CHECK(position IN ('GK', 'DEF', 'MID', 'FWD')),
    birth_date TEXT NOT NULL,
    nationality TEXT NOT NULL,
    shirt_number INTEGER NOT NULL,
    overall INTEGER NOT NULL CHECK(overall >= 40 AND overall <= 100),
    attributes TEXT NOT NULL,
    fingerprint_name TEXT NOT NULL,
    fingerprint_birth_date TEXT NOT NULL,
    fingerprint_nationality TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE INDEX idx_competitions_code ON competitions(code);
CREATE INDEX idx_competitions_game_id ON competitions(game_id);
CREATE INDEX idx_seasons_code ON seasons(code);
CREATE INDEX idx_seasons_competition_id ON seasons(competition_id);
CREATE INDEX idx_divisions_code ON divisions(code);
CREATE INDEX idx_divisions_season_id ON divisions(season_id);
CREATE INDEX idx_participations_code ON participations(code);
CREATE INDEX idx_participations_division_id ON participations(division_id);
CREATE INDEX idx_participations_team_id ON participations(team_id);
CREATE INDEX idx_teams_code ON teams(code);
CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_teams_fingerprint ON teams(fingerprint_name, fingerprint_country, fingerprint_founded);
CREATE INDEX idx_players_code ON players(code);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_contract_team_id ON players(contract_team_id);
CREATE INDEX idx_players_fingerprint ON players(fingerprint_name, fingerprint_birth_date, fingerprint_nationality);
```

### Key Design Decisions

1. **UUID as Primary Key**: Prevents collisions, allows safe duplication
2. **Code as User-Facing Identifier**: Human-readable, shown in UI
3. **Foreign Keys Use UUIDs**: Internal references stable even if code changes
4. **Fingerprints Stored**: For efficient duplicate detection
5. **No Reverse Arrays**: Relationships derived via queries
6. **Updated_at Timestamp**: Track when entities last modified

## Import Process

### Phase 1: Package Extraction & Validation

#### Step 1.1: Extract Package
1. User selects .zip file
2. System extracts to temporary directory
3. Verify manifest.json exists
4. Load manifest and check compatibility
5. Scan for known entity folders (competitions, seasons, divisions, etc.)
6. Warn about unknown files/folders but do not fail (forward compatibility)

#### Step 1.2: Schema Validation

Validate in order:
1. **Manifest validation**
   - Required fields present
   - `data_version` compatible with game
   - `game_version` compatible with game

2. **File structure validation**
   - All referenced entity files exist
   - File names match entity codes (e.g., `BR_FLA.json` for team with code `BR_FLA`)
   - Unknown files/folders logged as warnings (not errors)

3. **JSON schema validation**
   - All JSON files parse correctly
   - Required fields present
   - Data types correct

4. **Enum validation**
   - `position`: GK, DEF, MID, FWD
   - `type`: league, cup, international
   - Valid country names (if country list available)

5. **Range validation**
   - Numeric fields within bounds
   - Date ranges valid
   - String lengths valid
   - Player ages valid (15-50)

6. **Code uniqueness validation (within package)**
   - No duplicate competition codes
   - No duplicate season codes
   - No duplicate division codes
   - No duplicate participation codes
   - No duplicate team codes
   - No duplicate player codes

7. **Forward reference validation**
   - All `competition_code` references exist in package
   - All `season_code` references exist in package
   - All `division_code` references exist in package
   - All `team_code` references exist in package
   - All `contract_team_code` references exist in package (if not null)
   - No orphaned entities
   - No circular references

8. **Consistency validation**
   - Count of participations referencing each division matches `num_teams`
   - Participation codes match pattern: `{division_code}__{team_code}`
   - No player appears in multiple teams (only one `contract_team_code`)

**On validation failure:**
- Show detailed error messages
- Indicate which file/field failed
- Do not proceed to duplicate detection

### Phase 2: Duplicate Detection

For each entity, check for duplicates in two ways:

#### 2.1: Code-Based Duplicates

Query database by `code`:
- If exists with same code → Potential **update** or **skip**
- If not exists → Potential **create**

#### 2.2: Fingerprint-Based Duplicates

Even if code doesn't match, check for same real-world entity using computed fingerprints:

**For Teams:**
```sql
SELECT * FROM teams
WHERE fingerprint_name = normalize_team_name(?)
  AND fingerprint_country = ?
  AND (fingerprint_founded = ? OR fingerprint_founded IS NULL OR ? IS NULL)
```

**For Players:**
```sql
SELECT * FROM players
WHERE fingerprint_name = normalize_player_name(?)
  AND fingerprint_birth_date = ?
  AND fingerprint_nationality = ?
```

**Fingerprint Computation:**
```typescript
function computeTeamFingerprint(team: Team): Fingerprint {
  return {
    normalized_name: normalizeTeamName(team.name),
    country: team.country,
    founded_year: team.founded_year || null
  };
}

function computePlayerFingerprint(player: Player): Fingerprint {
  return {
    normalized_name: normalizePlayerName(player.name),
    birth_date: player.birth_date,
    nationality: player.nationality
  };
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
```

**Detection Result:**
- **Exact match (code + fingerprint)**: Same entity
- **Code match, fingerprint differs**: Possibly renamed/moved entity
- **Fingerprint match, code differs**: Duplicate entity with different code
- **No match**: New entity

### Phase 3: Preview

Generate comprehensive preview summary showing all changes:

```
┌─────────────────────────────────────────────────────────────┐
│ Package: Campeonato Brasileiro 2025                        │
│ Author: Community Author                                    │
│ Version: 1.0.0                                              │
└─────────────────────────────────────────────────────────────┘

┌─── Competitions ────────────────────────────────────────────┐
│ ✓ CREATE: BR_BRASILEIRAO (Campeonato Brasileiro)           │
└─────────────────────────────────────────────────────────────┘

┌─── Seasons ─────────────────────────────────────────────────┐
│ ✓ CREATE: BR_BRASILEIRAO_2025 (2025)                       │
└─────────────────────────────────────────────────────────────┘

┌─── Divisions ───────────────────────────────────────────────┐
│ ✓ CREATE: BR_BRASILEIRAO_2025_D1 (Série A)                 │
│ ✓ CREATE: BR_BRASILEIRAO_2025_D2 (Série B)                 │
└─────────────────────────────────────────────────────────────┘

┌─── Teams (40 total) ────────────────────────────────────────┐
│ ✓ CREATE: BR_FLA (Flamengo)                                │
│ ⚠ CONFLICT: BR_PAL (Palmeiras)                             │
│   └─ Existing: BR_PAL (Palmeiras, founded 1914)            │
│   └─ Fingerprint match: Same team, different data          │
│   └─ Action required: Update / Skip / Clone                │
│ ✓ UPDATE: BR_SAO (São Paulo)                               │
│   └─ Existing data will be updated                         │
│ ⚠ DUPLICATE: BR_COR (Corinthians)                          │
│   └─ Possible duplicate of: BR_CORINTHIANS (same name)     │
│   └─ Action required: Link to existing / Clone             │
│ ✓ CREATE: 36 more teams...                                 │
└─────────────────────────────────────────────────────────────┘

┌─── Players (880 total) ─────────────────────────────────────┐
│ ✓ CREATE: 850 new players                                  │
│ ✓ UPDATE: 25 existing players                              │
│ ⚠ CONFLICT: 5 players require resolution                   │
│   ├─ BR_GABRIEL_BARBOSA_1996_08_30                         │
│   │   └─ Existing: Different team contract                 │
│   │   └─ Action: Update contract / Keep existing           │
│   └─ ... (4 more)                                          │
└─────────────────────────────────────────────────────────────┘

┌─── Participations (40 total) ───────────────────────────────┐
│ ✓ CREATE: 40 new participations                            │
└─────────────────────────────────────────────────────────────┘

┌─── Conflicts Requiring User Action ─────────────────────────┐
│ 6 conflicts detected. Please resolve before importing.     │
└─────────────────────────────────────────────────────────────┘

[Resolve Conflicts] [Cancel]
```

### Phase 4: Conflict Resolution

For each conflict, present user with choices:

#### Team/Player Conflict Options:
1. **Update existing** - Replace existing data with package data (keeps same UUID)
2. **Skip** - Keep existing data, ignore package data
3. **Clone (Generate new IDs)** - Import as new entity with new UUID and modified code
4. **Link to existing** - For fingerprint matches with different codes
5. **Cancel import** - Abort entire import

#### Conflict Resolution UI:
```
┌─── Resolve Conflict: BR_PAL (Palmeiras) ────────────────────┐
│                                                             │
│ Package data:                                               │
│   Code: BR_PAL                                              │
│   Name: Palmeiras                                           │
│   Founded: 1914                                             │
│   Stadium: Allianz Parque (43,713)                          │
│   Budget: $48,000,000                                       │
│   Reputation: 84                                            │
│                                                             │
│ Existing data:                                              │
│   Code: BR_PAL                                              │
│   UUID: 550e8400-e29b-41d4-a716-446655440000                │
│   Name: Palmeiras                                           │
│   Founded: 1914                                             │
│   Stadium: Allianz Parque (45,000)                          │
│   Budget: $50,000,000                                       │
│   Reputation: 86                                            │
│                                                             │
│ Resolution:                                                 │
│   ( ) Update existing - Use package data (keep UUID)       │
│   (•) Skip - Keep existing data (recommended)               │
│   ( ) Clone - Import with new UUID and code: BR_PAL_2      │
│                                                             │
│ [Apply to all similar conflicts]                           │
│                                                             │
│ [< Previous]  [Skip All]  [Next >]  [Cancel]               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5: Final Preview

After all conflicts resolved, show final summary:

```
┌─── Final Import Summary ────────────────────────────────────┐
│ Ready to import:                                            │
│                                                             │
│   Competitions:  1 create                                   │
│   Seasons:       1 create                                   │
│   Divisions:     2 create                                   │
│   Teams:         36 create, 3 update, 1 skip                │
│   Players:       850 create, 25 update, 5 skip              │
│   Participations: 40 create                                 │
│                                                             │
│ No data has been written yet.                               │
│                                                             │
│ [Import] [Cancel]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Phase 6: Apply Changes

Transaction-based import with rollback on error:

```
BEGIN TRANSACTION;

1. For each competition:
   - Generate UUID if creating
   - Insert or update by code

2. For each season:
   - Generate UUID if creating
   - Lookup competition UUID by code
   - Insert or update by code

3. For each division:
   - Generate UUID if creating
   - Lookup season UUID by code
   - Insert or update by code

4. For each team:
   - Generate UUID if creating
   - Compute and store fingerprint
   - Insert or update by code

5. For each player:
   - Generate UUID if creating
   - Compute and store fingerprint
   - Lookup contract_team UUID by code (if contract_team_code provided)
   - Insert or update by code

6. For each participation:
   - Generate UUID if creating
   - Lookup division UUID by code
   - Lookup team UUID by code
   - Insert or update by code

7. Verify all relationships valid

COMMIT;
```

**On error:**
- ROLLBACK entire transaction
- Show detailed error to user
- No partial imports
- Clean up temporary files

**On success:**
- Show success message with final counts
- Refresh editor view
- Clean up temporary files
- Log import for audit trail

## Export Process

### Phase 1: Entity Selection

User selects what to export:
- Select competition(s)
- Select season(s)
- Select division(s)
- System automatically includes:
  - Parent entities (division → season → competition)
  - Related participations
  - Related teams (only those participating)
  - Related players (only those with `contract_team_id` to participating teams)

### Phase 2: Data Extraction

For each selected division:
1. Query division by UUID
2. Query season for that division
3. Query competition for that season
4. Query all participations in division
5. Query all teams referenced in participations (by UUID)
6. Query all players with `contract_team_id` matching those teams (by UUID)
7. Build normalized structure using codes (not UUIDs)

### Phase 3: Package Generation

1. Create temporary directory
2. Generate manifest.json with entity counts
3. For each competition: Generate `competitions/{code}.json` (no UUID, no reverse refs)
4. For each season: Generate `seasons/{code}.json` (no UUID, no reverse refs)
5. For each division: Generate `divisions/{code}.json` (no UUID, no reverse refs)
6. For each participation: Generate `participations/{code}.json` (no UUID)
7. For each team: Generate `teams/{code}.json` (no UUID, no fingerprint, no player codes)
8. For each player: Generate `players/{code}.json` (no UUID, no fingerprint)
9. Create ZIP archive
10. Save to user-selected location

### Phase 4: Validation

Before saving:
- Validate generated package using same validation rules
- Ensure all code references valid
- Check entity counts match manifest
- Verify package is re-importable

**Output filename:**
```
{competition_name}-{season_year}-{timestamp}.zip

Examples:
campeonato-brasileiro-2025-20250115_103045.zip
premier-league-2024-20250115_103045.zip
```

## Error Handling

### Validation Errors

```
┌─── Validation Failed ───────────────────────────────────────┐
│                                                             │
│ manifest.json:                                              │
│   ✗ Missing required field: data_version                   │
│                                                             │
│ divisions/BR_BRASILEIRAO_2025_D1.json:                      │
│   ✗ num_teams (25) doesn't match participations (20)       │
│                                                             │
│ teams/BR_FLA.json:                                          │
│   ✗ Invalid reputation: 150 (must be 0-100)                │
│   ✗ Invalid budget: -5000 (must be positive)               │
│                                                             │
│ players/BR_GABRIEL_BARBOSA_1996_08_30.json:                 │
│   ✗ Invalid position: "ST" (must be GK, DEF, MID, FWD)     │
│   ✗ Missing required field: birth_date                     │
│                                                             │
│ Reference Errors:                                           │
│   ✗ Season BR_BRASILEIRAO_2025 references competition      │
│     "BR_SERIE_A" which does not exist in package            │
│   ✗ Participation BR_BRASILEIRAO_2025_D1__FLU references   │
│     team "BR_FLU" which does not exist in package           │
│   ✗ Player BR_GABRIEL_BARBOSA contract_team_code           │
│     "BR_UNKNOWN" does not exist in package                  │
│                                                             │
│ Warnings:                                                   │
│   ⚠ Unknown folder: custom_data/ (ignored)                 │
│   ⚠ Unknown file: README.md (ignored)                      │
│                                                             │
│ Cannot proceed with import. Fix errors and try again.      │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Import Errors

```
┌─── Import Failed ───────────────────────────────────────────┐
│                                                             │
│ Database error during import:                               │
│   Foreign key constraint violation                          │
│                                                             │
│ Details:                                                    │
│   Participation BR_BRASILEIRAO_2025_D1__BR_FLA references   │
│   team code "BR_FLA" which does not exist in database       │
│                                                             │
│ Transaction rolled back. No changes were applied.           │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Export Errors

```
┌─── Export Failed ───────────────────────────────────────────┐
│                                                             │
│ Unable to create ZIP archive:                               │
│   Insufficient disk space                                   │
│                                                             │
│ Required: 45 MB                                             │
│ Available: 12 MB                                            │
│                                                             │
│ Please free up space and try again.                         │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Summary of Key Design Decisions

### 1. No Reverse-Reference Arrays
- ❌ Don't store `competition.season_codes[]`
- ❌ Don't store `season.division_codes[]`
- ❌ Don't store `division.participation_codes[]`
- ❌ Don't store `team.player_codes[]`
- ✅ Relationships validated through forward refs only
- ✅ Derived data queried when needed

### 2. Separate ID vs Code
- ✅ `id`: UUID (internal, stable, prevents collisions)
- ✅ `code`: Human-readable string (user-facing, in JSON)
- ✅ Foreign keys use UUIDs (not codes)
- ✅ Export uses codes (not UUIDs)
- ✅ "Clone" option generates new UUIDs safely

### 3. Participation ID Format
- ✅ Pattern: `{division_code}__{team_code}`
- ✅ Double underscore `__` separator
- ✅ Example: `BR_BRASILEIRAO_2025_D1__BR_FLA`

### 4. Single Source of Truth for Rosters
- ✅ `player.contract_team_code` is authoritative
- ❌ No `team.player_codes[]` array
- ✅ Team roster derived by querying players

### 5. Computed Fingerprints
- ❌ Don't require `fingerprint` object in JSON
- ✅ Compute fingerprints during import from normalized fields
- ✅ Store in database for duplicate detection
- ✅ If provided in JSON, treat as optional/ignored

### 6. Forward Compatibility
- ✅ Unknown files/folders logged as warnings
- ❌ Don't fail validation on unexpected files
- ✅ Validate only known entity types
- ✅ Allows future schema extensions

## Implementation Checklist

### Database Layer

- [ ] Create migration for UUID-based tables (competitions, seasons, divisions, participations)
- [ ] Create migration to add code + fingerprint columns to teams and players
- [ ] Update Team model with code and fingerprint fields
- [ ] Update Player model with code and fingerprint fields
- [ ] Create Competition model with code (no reverse refs)
- [ ] Create Season model with code (no reverse refs)
- [ ] Create Division model with code (no reverse refs)
- [ ] Create Participation model with code
- [ ] Create CompetitionRepository (query by code and UUID)
- [ ] Create SeasonRepository (query by code and UUID)
- [ ] Create DivisionRepository (query by code and UUID)
- [ ] Create ParticipationRepository (query by code and UUID)
- [ ] Update TeamRepository (fingerprint queries, code lookups)
- [ ] Update PlayerRepository (fingerprint queries, code lookups, contract queries)

### Backend (Rust)

- [ ] Create package models (src-tauri/src/models/package.rs)
- [ ] Create fingerprint module (src-tauri/src/infrastructure/fingerprint.rs)
- [ ] Create validation module (src-tauri/src/infrastructure/validation.rs)
  - [ ] Validate forward refs only
  - [ ] Warn on unknown files (don't fail)
  - [ ] Validate participation code format
- [ ] Create duplicate detection module (src-tauri/src/infrastructure/duplicate_detection.rs)
  - [ ] Code-based detection
  - [ ] Fingerprint-based detection
- [ ] Create package importer (src-tauri/src/infrastructure/package_importer.rs)
  - [ ] Generate UUIDs on import
  - [ ] Compute fingerprints
  - [ ] Resolve codes to UUIDs for foreign keys
- [ ] Create package exporter (src-tauri/src/infrastructure/package_exporter.rs)
  - [ ] Export codes (not UUIDs)
  - [ ] Omit reverse-ref arrays
  - [ ] Omit fingerprints
- [ ] Add Tauri command: validate_package
- [ ] Add Tauri command: detect_duplicates
- [ ] Add Tauri command: preview_import
- [ ] Add Tauri command: apply_import
- [ ] Add Tauri command: export_package
- [ ] Add ZIP handling dependency (zip crate)
- [ ] Add UUID generation (uuid crate)
- [ ] Add string normalization (unicode-normalization crate)

### Frontend (Svelte)

- [ ] Create TypeScript types for new entity model (code-based)
- [ ] Create validation error display component
- [ ] Create duplicate detection UI component
- [ ] Create conflict resolution dialog component
  - [ ] Update / Skip / Clone options
- [ ] Create preview dialog component
- [ ] Update import UI for new flow
- [ ] Create export UI with entity selection
- [ ] Add progress indicators
- [ ] Add comprehensive error handling
- [ ] Add i18n keys for all new UI text

### Documentation

- [ ] Update data model documentation
- [ ] Create import guide for users
- [ ] Create export guide for users
- [ ] Create package creation guide for modders
- [ ] Create migration guide from old format
- [ ] Create example packages (code-based, no UUIDs)

### Testing

- [ ] Create test fixtures for valid packages
- [ ] Create test fixtures for invalid packages
- [ ] Create test fixtures with unknown files (forward compat)
- [ ] Write validation tests
- [ ] Write duplicate detection tests (code + fingerprint)
- [ ] Write fingerprint matching tests
- [ ] Write import tests (UUID generation)
- [ ] Write export tests (code export, no UUIDs)
- [ ] Write round-trip tests
- [ ] Manual testing with real data
- [ ] Test conflict resolution flows (update/skip/clone)

## Future Enhancements

### Phase 2 Features

- Multi-competition packages
- Incremental updates (patch packages)
- Package dependencies
- Asset support (logos, photos)
- Package signing and verification
- Automatic dependency resolution
- Version migration tools
- Contracts/registrations as separate entities

### Community Features

- Online package repository
- Package rating and reviews
- Package collections/bundles
- Version update notifications
- Automatic package updates
- Community curation
