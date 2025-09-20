-- SQL da eseguire su Supabase Dashboard - Versione 2
-- Correzione per errore 400 su get_user_analytics e colonne mancanti

-- Prima elimina tutte le funzioni problematiche
DROP FUNCTION IF EXISTS get_cards_for_review(uuid);
DROP FUNCTION IF EXISTS get_user_analytics(uuid, integer);
DROP FUNCTION IF EXISTS get_user_stats(uuid);

-- Aggiungi colonne opzionali se non esistono (per funzionalità avanzate)
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS response_time INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS study_mode TEXT DEFAULT 'spaced_repetition',
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'desktop';

-- Funzione semplificata per ottenere carte da ripassare
CREATE FUNCTION get_cards_for_review(user_uuid UUID)
RETURNS TABLE (
  card_id UUID,
  question TEXT,
  answer TEXT,
  difficulty INTEGER,
  set_name TEXT,
  repetitions INTEGER,
  ease_factor DECIMAL,
  interval_days INTEGER,
  next_review_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as card_id,
        f.question,
        f.answer,
        f.difficulty,
        fs.name as set_name,
        COALESCE(ss.repetitions, 0) as repetitions,
        COALESCE(ss.ease_factor, 2.5) as ease_factor,
        COALESCE(ss.interval_days, 1) as interval_days,
        COALESCE(ss.next_review_date, CURRENT_DATE) as next_review_date
    FROM flashcards f
    JOIN flashcard_sets fs ON f.set_id = fs.id
    LEFT JOIN study_sessions ss ON ss.card_id = f.id AND ss.user_id = user_uuid
    WHERE fs.user_id = user_uuid 
    AND (ss.next_review_date IS NULL OR ss.next_review_date <= CURRENT_DATE)
    ORDER BY ss.next_review_date ASC NULLS FIRST, f.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione semplificata per analytics (senza subquery complesse)
CREATE FUNCTION get_user_analytics(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date DATE;
BEGIN
    start_date := CURRENT_DATE - INTERVAL '1 day' * days_back;
    
    SELECT json_build_object(
        'total_sets', (
            SELECT COUNT(DISTINCT id) 
            FROM flashcard_sets 
            WHERE user_id = user_uuid
        ),
        'total_cards', (
            SELECT COALESCE(SUM(total_cards), 0) 
            FROM flashcard_sets 
            WHERE user_id = user_uuid
        ),
        'study_streak', 0,
        'accuracy_rate', 0,
        'total_study_time', 0,
        'cards_due_today', (
            SELECT COUNT(*) 
            FROM flashcards f
            JOIN flashcard_sets fs ON f.set_id = fs.id
            WHERE fs.user_id = user_uuid
        ),
        'weekly_progress', '[]'::json
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione legacy semplificata
CREATE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sets', COUNT(DISTINCT fs.id),
        'total_cards', COALESCE(SUM(fs.total_cards), 0),
        'public_sets', COUNT(DISTINCT fs.id) FILTER (WHERE fs.is_public = TRUE),
        'total_study_sessions', 0,
        'cards_due_today', 0
    ) INTO result
    FROM flashcard_sets fs
    WHERE fs.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
