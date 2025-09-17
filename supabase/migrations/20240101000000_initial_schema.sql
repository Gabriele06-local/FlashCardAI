-- Row Level Security è già abilitato per auth.users

-- Tabella per flashcard sets
CREATE TABLE flashcard_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_public BOOLEAN DEFAULT FALSE,
  total_cards INTEGER DEFAULT 0
);

-- Tabella per singole flashcard
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  order_index INTEGER DEFAULT 0
);

-- Tabella per tracciare studio (ripetizione spaziata)
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  quality INTEGER, -- 0-5 (SM-2 algorithm)
  ease_factor DECIMAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review_date DATE DEFAULT CURRENT_DATE,
  repetitions INTEGER DEFAULT 0,
  studied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, card_id)
);

-- Tabella per API usage tracking
CREATE TABLE api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 0,
  request_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, request_date)
);

-- RLS Policies per flashcard_sets
CREATE POLICY "Users can view own flashcard sets" ON flashcard_sets
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create own flashcard sets" ON flashcard_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sets" ON flashcard_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sets" ON flashcard_sets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies per flashcards
CREATE POLICY "Users can view flashcards from accessible sets" ON flashcards
  FOR SELECT USING (
    set_id IN (
      SELECT id FROM flashcard_sets 
      WHERE user_id = auth.uid() OR is_public = TRUE
    )
  );

CREATE POLICY "Users can manage flashcards in own sets" ON flashcards
  FOR ALL USING (
    set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid())
  );

-- RLS Policies per study_sessions
CREATE POLICY "Users can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies per api_usage
CREATE POLICY "Users can view own api usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own api usage" ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api usage" ON api_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes per performance
CREATE INDEX idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX idx_flashcard_sets_public ON flashcard_sets(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_study_sessions_user_card ON study_sessions(user_id, card_id);
CREATE INDEX idx_study_sessions_next_review ON study_sessions(user_id, next_review_date);
CREATE INDEX idx_api_usage_user_date ON api_usage(user_id, request_date);

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at su flashcard_sets
CREATE TRIGGER update_flashcard_sets_updated_at 
    BEFORE UPDATE ON flashcard_sets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Funzione per calcolare statistiche utente
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sets', COUNT(DISTINCT fs.id),
        'total_cards', COALESCE(SUM(fs.total_cards), 0),
        'public_sets', COUNT(DISTINCT fs.id) FILTER (WHERE fs.is_public = TRUE),
        'total_study_sessions', COUNT(DISTINCT ss.id),
        'cards_due_today', COUNT(DISTINCT ss.card_id) FILTER (WHERE ss.next_review_date <= CURRENT_DATE)
    ) INTO result
    FROM flashcard_sets fs
    LEFT JOIN flashcards f ON f.set_id = fs.id
    LEFT JOIN study_sessions ss ON ss.card_id = f.id AND ss.user_id = user_uuid
    WHERE fs.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



