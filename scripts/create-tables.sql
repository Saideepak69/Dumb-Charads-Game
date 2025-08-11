-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_players INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  current_word VARCHAR(100),
  current_drawer_id UUID REFERENCES users(id),
  time_left INTEGER DEFAULT 600,
  round_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_players table
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  is_drawing BOOLEAN DEFAULT FALSE,
  has_guessed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create guesses table
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guess TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drawing_strokes table for real-time drawing sync
CREATE TABLE IF NOT EXISTS drawing_strokes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stroke_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_is_public ON rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_guesses_room_id ON guesses(room_id);
CREATE INDEX IF NOT EXISTS idx_drawing_strokes_room_id ON drawing_strokes(room_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_strokes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Create policies for rooms table
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Host can update their rooms" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Host can delete their rooms" ON rooms FOR DELETE USING (true);

-- Create policies for room_players table
CREATE POLICY "Anyone can view room players" ON room_players FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON room_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own data" ON room_players FOR UPDATE USING (true);
CREATE POLICY "Players can leave rooms" ON room_players FOR DELETE USING (true);

-- Create policies for guesses table
CREATE POLICY "Anyone can view guesses" ON guesses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert guesses" ON guesses FOR INSERT WITH CHECK (true);

-- Create policies for drawing_strokes table
CREATE POLICY "Anyone can view drawing strokes" ON drawing_strokes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert drawing strokes" ON drawing_strokes FOR INSERT WITH CHECK (true);
