# Neofoot - Development Roadmap

## Project Vision
Create a classic football management simulator inspired by Brasfoot, Elifoot, and Championship Manager 1992, with modern UI/UX and community-driven modding capabilities.

---

## Current Status: MVP Foundation Complete

### What's Working (v0.1.0 - MVP Foundation)
- Database infrastructure with SQLite and migrations
- JSON-based league import system (Community Modding System)
- Complete CRUD operations for games, leagues, teams, players, saved games
- Main menu and navigation flow
- New game creation (select league, select team)
- Load/save game functionality
- Team management screen with squad view
- Player list with sorting and position grouping
- League and team editor interfaces
- Internationalization (English, Portuguese, Spanish)
- Custom UI components (Button, Alert, Dialog)
- Tauri IPC communication layer

### What's Not Yet Implemented
- Match simulation engine
- League/competition system
- Transfers and transfer market
- Tactics and formations
- Financial management
- Player development and aging
- Season progression mechanics
- Match history and statistics

---

## Development Phases

## Phase 1: Core Gameplay Loop (v0.2.0 - v0.4.0)
**Goal:** Implement the basic match-day experience and league progression

### v0.2.0 - Match Simulation Foundation
**Priority:** HIGH
**Estimated Effort:** 3-4 weeks

#### Backend (Rust)
- [ ] **Match Engine Core**
  - [ ] Basic match simulation algorithm
  - [ ] Player attribute influence on match events
  - [ ] Position-based role calculations (GK, DEF, MID, FWD)
  - [ ] Random event generation (shots, passes, tackles)
  - [ ] Goal scoring system
  - [ ] Match result calculation (home wins, draws, away wins)
  - [ ] Match duration and time progression

- [ ] **Match Data Models**
  - [ ] Match model (home_team, away_team, date, status)
  - [ ] Match events model (goals, cards, substitutions)
  - [ ] Match statistics model (shots, possession, passes)
  - [ ] Player match performance model

- [ ] **Database Migrations**
  - [ ] `004_create_matches.sql` - matches table
  - [ ] `005_create_match_events.sql` - match events and statistics

#### Frontend (Svelte)
- [ ] **Match Preparation Screen**
  - [ ] View next match details (opponent, date, venue)
  - [ ] Select starting XI (11 players)
  - [ ] Choose formation (4-4-2, 4-3-3, 3-5-2, etc.)
  - [ ] Set basic tactics (offensive/defensive)
  - [ ] Name substitutes

- [ ] **Match Simulation View**
  - [ ] Live match commentary/events display
  - [ ] Current score and time
  - [ ] Match statistics (shots, possession)
  - [ ] Real-time event feed (goals, cards, subs)
  - [ ] Speed controls (1x, 2x, 4x, instant)
  - [ ] Pause/resume functionality

- [ ] **Match Result Screen**
  - [ ] Final score display
  - [ ] Man of the match
  - [ ] Full match statistics
  - [ ] Player ratings
  - [ ] Goal scorers and times
  - [ ] Return to team management

#### UI Components
- [ ] FormationSelector component
- [ ] MatchTimeline component
- [ ] PlayerRating component
- [ ] LiveMatchStats component

#### Tauri Commands
- [ ] `simulate_match(match_id: i64) -> MatchResult`
- [ ] `get_match(match_id: i64) -> Match`
- [ ] `get_match_events(match_id: i64) -> Vec<MatchEvent>`
- [ ] `get_next_match(team_id: i64) -> Option<Match>`
- [ ] `set_lineup(match_id: i64, lineup: Vec<i64>) -> bool`

---

### v0.3.0 - League System & Competition
**Priority:** HIGH
**Estimated Effort:** 2-3 weeks

#### Backend (Rust)
- [ ] **League Competition Logic**
  - [ ] Fixture generation (round-robin system)
  - [ ] Match scheduling (weekly matches)
  - [ ] League table calculation (points, goals, GD)
  - [ ] Season progression (advance to next matchday)
  - [ ] End of season detection
  - [ ] Champion determination

- [ ] **League Table Model**
  - [ ] Team standings (position, played, won, drawn, lost, GF, GA, GD, points)
  - [ ] Update standings after each match
  - [ ] Sort by points, then GD, then GF

- [ ] **Database Migrations**
  - [ ] `006_create_fixtures.sql` - scheduled matches
  - [ ] `007_create_standings.sql` - league table data

#### Frontend (Svelte)
- [ ] **League Table View**
  - [ ] Full standings display
  - [ ] Highlight user's team
  - [ ] Show form (last 5 results: W/D/L)
  - [ ] Color-coded zones (champions, relegation)
  - [ ] Click team to view details

- [ ] **Fixtures/Results Page**
  - [ ] View all league fixtures
  - [ ] Filter by matchday/round
  - [ ] See past results
  - [ ] View upcoming matches
  - [ ] Simulate all matches in round

- [ ] **Calendar/Schedule View**
  - [ ] Timeline of season
  - [ ] Current matchday indicator
  - [ ] Advance to next match button
  - [ ] Quick sim to next match

#### Tauri Commands
- [ ] `generate_fixtures(league_id: i64) -> Vec<Match>`
- [ ] `get_standings(league_id: i64) -> Vec<Standing>`
- [ ] `get_fixtures(league_id: i64, matchday: Option<i64>) -> Vec<Match>`
- [ ] `advance_to_next_match(game_id: i64) -> NextMatch`
- [ ] `simulate_all_matches(matchday: i64) -> Vec<MatchResult>`

---

### v0.4.0 - Basic Tactics & Formations
**Priority:** MEDIUM
**Estimated Effort:** 2 weeks

#### Backend (Rust)
- [ ] **Tactical System**
  - [ ] Formation definitions (4-4-2, 4-3-3, 3-5-2, 5-3-2, 4-2-3-1)
  - [ ] Position mapping (which shirt numbers play where)
  - [ ] Tactical presets (attacking, balanced, defensive)
  - [ ] Mentality influence on match engine
  - [ ] Formation validation (must have 1 GK, valid positions)

- [ ] **Tactics Model**
  - [ ] Team tactics (formation, mentality, pressing)
  - [ ] Player instructions (basic only)

#### Frontend (Svelte)
- [ ] **Tactics Screen**
  - [ ] Visual formation editor (pitch diagram)
  - [ ] Drag-and-drop player positioning
  - [ ] Formation selector dropdown
  - [ ] Mentality slider (defensive to attacking)
  - [ ] Save tactics to team

- [ ] **Pitch Visualization**
  - [ ] 2D football pitch component
  - [ ] Player position markers
  - [ ] Formation shape display
  - [ ] Player names/numbers on pitch

#### UI Components
- [ ] TacticsBoard component
- [ ] FormationPreset component
- [ ] PlayerPositionMarker component

#### Tauri Commands
- [ ] `get_team_tactics(team_id: i64) -> Tactics`
- [ ] `save_team_tactics(team_id: i64, tactics: Tactics) -> bool`
- [ ] `validate_formation(formation: Formation) -> bool`

---

## Phase 2: Team Building & Management (v0.5.0 - v0.7.0)
**Goal:** Enable squad management, transfers, and player development

### v0.5.0 - Transfer Market Basics
**Priority:** HIGH
**Estimated Effort:** 3 weeks

#### Backend (Rust)
- [ ] **Transfer Market Logic**
  - [ ] Free agent pool (players without teams)
  - [ ] Transfer listing system
  - [ ] Bid/offer system
  - [ ] Player value calculation based on attributes and age
  - [ ] Budget validation (can't spend more than you have)
  - [ ] Contract system (basic: wage, contract length)

- [ ] **Transfer Models**
  - [ ] Transfer model (player, from_team, to_team, fee, date)
  - [ ] Contract model (player, team, wage, start_date, end_date)
  - [ ] TransferListing model (player, asking_price, status)

- [ ] **Database Migrations**
  - [ ] `008_create_transfers.sql`
  - [ ] `009_create_contracts.sql`

#### Frontend (Svelte)
- [ ] **Transfer Market Screen**
  - [ ] Browse available players
  - [ ] Filter by position, age, nationality
  - [ ] Sort by price, overall rating
  - [ ] View player details
  - [ ] Make transfer offer
  - [ ] Transfer budget display

- [ ] **Squad Management**
  - [ ] Release players (free transfer out)
  - [ ] List players for sale
  - [ ] View player contracts
  - [ ] Contract expiry warnings

- [ ] **Transfer Negotiation**
  - [ ] Offer amount input
  - [ ] Wage negotiation
  - [ ] Contract length selection
  - [ ] Accept/reject/counter offer

#### UI Components
- [ ] TransferMarket component
- [ ] PlayerCard component (detailed view)
- [ ] TransferOffer component
- [ ] ContractDetails component

#### Tauri Commands
- [ ] `get_transfer_market(filters: TransferFilters) -> Vec<Player>`
- [ ] `make_transfer_offer(team_id, player_id, offer_amount, wage) -> TransferResult`
- [ ] `list_player_for_transfer(player_id, asking_price) -> bool`
- [ ] `release_player(player_id) -> bool`
- [ ] `get_team_contracts(team_id) -> Vec<Contract>`

---

### v0.6.0 - Player Development & Aging
**Priority:** MEDIUM
**Estimated Effort:** 2 weeks

#### Backend (Rust)
- [ ] **Player Development System**
  - [ ] Age-based attribute progression
  - [ ] Peak age ranges (24-28 for most players)
  - [ ] Youth development (improve faster when young)
  - [ ] Decline curve (gradual decrease after 30)
  - [ ] Training impact on attributes
  - [ ] Match experience influence
  - [ ] Overall rating recalculation

- [ ] **Development Model**
  - [ ] PlayerDevelopment model (tracking growth)
  - [ ] TrainingFocus model (which attributes to develop)

#### Frontend (Svelte)
- [ ] **Player Development View**
  - [ ] Attribute history graph
  - [ ] Potential indicator
  - [ ] Age and development stage
  - [ ] Training focus selector (per player)

- [ ] **Squad Overview Enhancements**
  - [ ] Age distribution view
  - [ ] Potential stars indicator
  - [ ] Contract expiry timeline

#### Tauri Commands
- [ ] `develop_players(game_id: i64) -> Vec<PlayerDevelopment>`
- [ ] `set_training_focus(player_id, focus: String) -> bool`
- [ ] `get_player_development_history(player_id) -> Vec<DevelopmentRecord>`

---

### v0.7.0 - Financial Management
**Priority:** MEDIUM
**Estimated Effort:** 2 weeks

#### Backend (Rust)
- [ ] **Finance System**
  - [ ] Weekly/monthly wage expenses
  - [ ] Match day income (ticket sales)
  - [ ] Prize money (league position bonuses)
  - [ ] Transfer profit/loss tracking
  - [ ] Budget balance calculation
  - [ ] Financial reports

- [ ] **Finance Models**
  - [ ] Transaction model (income/expense records)
  - [ ] Budget model (current balance, weekly costs)

- [ ] **Database Migrations**
  - [ ] `010_create_finances.sql`

#### Frontend (Svelte)
- [ ] **Finance Dashboard**
  - [ ] Current budget display
  - [ ] Income/expense breakdown
  - [ ] Weekly wage bill
  - [ ] Transfer balance
  - [ ] Financial history graph

- [ ] **Budget Alerts**
  - [ ] Low funds warning
  - [ ] Bankruptcy risk indicator

#### Tauri Commands
- [ ] `get_team_finances(team_id) -> FinancialSummary`
- [ ] `get_transactions(team_id, date_range) -> Vec<Transaction>`
- [ ] `process_weekly_finances(game_id) -> FinanceResult`

---

## Phase 3: Advanced Features (v0.8.0 - v1.0.0)
**Goal:** Polish and advanced management features

### v0.8.0 - Statistics & History
**Priority:** LOW
**Estimated Effort:** 2 weeks

- [ ] Player career statistics (goals, assists, appearances)
- [ ] Team records (biggest win, longest streak)
- [ ] Historical league tables (past seasons)
- [ ] All-time top scorers
- [ ] Player awards (Player of the Year, Golden Boot)
- [ ] Hall of fame

---

### v0.9.0 - Multiple Competitions
**Priority:** LOW
**Estimated Effort:** 3 weeks

- [ ] Cup competitions (knockout tournaments)
- [ ] Multiple leagues in same game
- [ ] Promotion/relegation system
- [ ] European competitions (if applicable)
- [ ] Fixture congestion management

---

### v1.0.0 - Polish & Release
**Priority:** HIGH
**Estimated Effort:** 3-4 weeks

- [ ] Performance optimization
- [ ] AI opponent management (simulate other teams' decisions)
- [ ] Improved UI/UX polish
- [ ] Tutorial/onboarding flow
- [ ] Settings and preferences
- [ ] Sound effects and music
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Packaging for Windows, macOS, Linux
- [ ] Release preparation

---

## Phase 4: Post-Launch Features (v1.1.0+)
**Goal:** Community features and advanced gameplay

### Future Enhancements
- [ ] **Multiplayer/Online Features**
  - [ ] Online league sharing
  - [ ] Leaderboards
  - [ ] Community challenges

- [ ] **Advanced Tactics**
  - [ ] Individual player instructions
  - [ ] Set piece strategies
  - [ ] Opposition instructions
  - [ ] Pressing triggers

- [ ] **Youth Academy**
  - [ ] Youth player generation
  - [ ] Academy investment
  - [ ] Youth tournaments

- [ ] **Staff Management**
  - [ ] Coaches and assistants
  - [ ] Scout network
  - [ ] Medical staff
  - [ ] Staff influence on team performance

- [ ] **Advanced Modding**
  - [ ] Logo/kit editor
  - [ ] Stadium customization
  - [ ] Custom competition creator
  - [ ] Mod marketplace/browser

- [ ] **3D Match Viewer**
  - [ ] 3D pitch visualization
  - [ ] Animated match highlights
  - [ ] Camera controls

---

## Community Modding System Status

### Current Implementation (Complete)
- JSON-based league import
- Single file per league format
- Community can create custom leagues
- Import via Team Editor UI
- Delete leagues functionality

### Future Enhancements
- [ ] Mod validation tool
- [ ] League file format documentation
- [ ] Example league templates
- [ ] Mod browser/downloader
- [ ] Automatic updates for imported leagues
- [ ] Logo and kit image support
- [ ] Real player data import tools

---

## Technical Debt & Improvements

### Code Quality
- [ ] Comprehensive error handling for all Tauri commands
- [ ] Unit tests for Rust backend logic
- [ ] Integration tests for database operations
- [ ] Frontend component testing
- [ ] Type safety improvements
- [ ] Performance profiling and optimization

### Infrastructure
- [ ] Database backup/restore functionality
- [ ] Auto-save feature
- [ ] Crash recovery
- [ ] Logging system improvements
- [ ] Analytics/telemetry (privacy-respecting)

### UI/UX
- [ ] Keyboard shortcuts
- [ ] Gamepad support improvements
- [ ] Accessibility features (screen reader support)
- [ ] Dark/light theme toggle
- [ ] Customizable UI layouts
- [ ] Responsive design improvements

---

## Release Schedule (Tentative)

| Version | Target Date | Status |
|---------|-------------|--------|
| v0.1.0 | Complete | MVP Foundation |
| v0.2.0 | +1 month | Match Simulation |
| v0.3.0 | +1.5 months | League System |
| v0.4.0 | +2 months | Tactics |
| v0.5.0 | +3 months | Transfers |
| v0.6.0 | +3.5 months | Player Development |
| v0.7.0 | +4 months | Finances |
| v0.8.0 | +4.5 months | Statistics |
| v0.9.0 | +5.5 months | Competitions |
| v1.0.0 | +7 months | Release |

---

## Success Metrics

### MVP Success (v0.2.0 - v0.4.0)
- User can play a full season with their team
- Match simulation feels engaging and realistic
- League progression works smoothly
- Save/load maintains game state correctly

### Pre-Release Success (v0.5.0 - v0.9.0)
- Transfer market provides strategic depth
- Player development adds long-term planning
- Financial management creates meaningful decisions
- Game is stable and performant

### Launch Success (v1.0.0)
- Cross-platform stability (Windows, macOS, Linux)
- Positive community feedback
- Active modding community
- 90%+ crash-free sessions
- Load times under 3 seconds

---

## Contributing

This roadmap is a living document. Community feedback and contributions are welcome. Priority may shift based on:
- User feedback
- Technical discoveries
- Community requests
- Development velocity

---

## License & Credits

Project created by Gabriel Lukke
Inspired by: Brasfoot, Elifoot, Championship Manager 1992

Technology: Svelte + Tauri + Rust + SQLite
