# League File Format

This document describes the JSON format for creating custom leagues in Neofoot.

## File Structure

Each league file should contain:
- League metadata
- Array of teams
- Each team contains an array of players

## Schema

### League Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full name of the league |
| country | string | Yes | Country where the league is based |
| division | number | Yes | Division level (1 = top tier) |
| season | number | Yes | Starting year of the season |

### Team Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full team name |
| short_name | string | Yes | Abbreviated name (max 3-4 chars) |
| stadium.name | string | Yes | Stadium name |
| stadium.capacity | number | Yes | Stadium capacity |
| budget | number | Yes | Team budget in currency units |
| reputation | number | Yes | Team reputation (0-100) |
| players | array | Yes | Array of player objects |

### Player Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Player full name |
| position | string | Yes | GK, DEF, MID, FWD |
| birth_date | string | Yes | Date in YYYY-MM-DD format |
| nationality | string | Yes | Player nationality |
| shirt_number | number | Yes | Jersey number (1-99) |
| overall | number | Yes | Overall rating (0-100) |
| attributes | object | Yes | Position-specific attributes |

### Player Attributes

#### Outfield Players (DEF, MID, FWD)
- pace (0-100)
- shooting (0-100)
- passing (0-100)
- dribbling (0-100)
- defending (0-100)
- physical (0-100)

#### Goalkeepers (GK)
- diving (0-100)
- handling (0-100)
- kicking (0-100)
- reflexes (0-100)
- positioning (0-100)

## Example

See `league_schema_example.json` for a complete example.

## File Naming

Use lowercase with underscores:
- `brazilian_serie_a.json`
- `english_premier_league.json`
- `spanish_la_liga.json`
