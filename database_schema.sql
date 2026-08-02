-- ============================================================
-- DATABASE SCHEMA: PTX SUMMER CUP 2026 (PostgreSQL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEAMS
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(20),
    ovr INTEGER DEFAULT 80,
    stats JSONB DEFAULT '{"attack":80,"defense":80,"speed":80,"power":80}'
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PLAYERS
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id INTEGER UNIQUE,
    name VARCHAR(100) NOT NULL,
    team_id VARCHAR(10) REFERENCES teams(id) ON DELETE CASCADE,
    position VARCHAR(10),
    avatar_url TEXT,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    mvp_count INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 70,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. MATCHES
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    home_team_id VARCHAR(10) REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id VARCHAR(10) REFERENCES teams(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. MATCH EVENTS
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id VARCHAR(10) REFERENCES teams(id) ON DELETE CASCADE,
    minute INTEGER NOT NULL,
    additional_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. HALL OF FAME
CREATE TABLE IF NOT EXISTS hall_of_fame (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    champion VARCHAR(100),
    runner_up VARCHAR(100),
    third_place VARCHAR(100),
    golden_boot VARCHAR(100),
    mvp VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. GALLERY
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    image_url TEXT NOT NULL,
    year INTEGER,
    category VARCHAR(50),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PREDICTIONS
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
