-- StudyOS Database Schema

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  focus_level INTEGER NOT NULL CHECK (focus_level >= 1 AND focus_level <= 5),
  tasks_planned INTEGER NOT NULL DEFAULT 0 CHECK (tasks_planned >= 0),
  tasks_completed INTEGER NOT NULL DEFAULT 0 CHECK (tasks_completed >= 0),
  efficiency_score NUMERIC(5,2) NOT NULL CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject);

-- Insert default subjects
INSERT INTO subjects (name) VALUES 
  ('Mathematics'),
  ('Physics'),
  ('Chemistry'),
  ('Biology'),
  ('History'),
  ('Literature'),
  ('Computer Science'),
  ('Economics')
ON CONFLICT (name) DO NOTHING;
