-- SQL da eseguire su Supabase Dashboard
-- Solo le funzioni mancanti (le tabelle esistono già)

-- Prima elimina le funzioni esistenti se hanno tipo di ritorno diverso
DROP FUNCTION IF EXISTS get_cards_for_review(uuid);
DROP FUNCTION IF EXISTS get_user_analytics(uuid, integer);
DROP FUNCTION IF EXISTS get_user_stats(uuid);

-- Funzione per ottenere carte da ripassare
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

-- Funzione per ottenere analytics utente completi
CREATE FUNCTION get_user_analytics(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date DATE;
BEGIN
    start_date := CURRENT_DATE - INTERVAL '1 day' * days_back;
    
    SELECT json_build_object(
        'total_sets', COUNT(DISTINCT fs.id),
        'total_cards', COALESCE(SUM(fs.total_cards), 0),
        'study_streak', (
            SELECT COUNT(*) FROM (
                SELECT DISTINCT date 
                FROM study_analytics 
                WHERE user_id = user_uuid 
                AND date >= start_date
                ORDER BY date DESC
                LIMIT 30
            ) t
        ),
        'accuracy_rate', (
            SELECT CASE 
                WHEN SUM(cards_studied) > 0 
                THEN ROUND((SUM(correct_answers)::DECIMAL / SUM(cards_studied)) * 100, 1)
                ELSE 0 
            END
            FROM study_analytics 
            WHERE user_id = user_uuid AND date >= start_date
        ),
        'total_study_time', COALESCE(SUM(study_time_minutes), 0),
        'cards_due_today', (
            SELECT COUNT(*) 
            FROM get_cards_for_review(user_uuid)
        ),
        'weekly_progress', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'date', date,
                    'cards_studied', cards_studied,
                    'correct_answers', correct_answers,
                    'incorrect_answers', incorrect_answers,
                    'accuracy', CASE 
                        WHEN cards_studied > 0 
                        THEN ROUND((correct_answers::DECIMAL / cards_studied) * 100, 1)
                        ELSE 0 
                    END
                )
            ), '[]'::json)
            FROM study_analytics 
            WHERE user_id = user_uuid 
            AND date >= start_date
            ORDER BY date DESC
        )
    ) INTO result
    FROM flashcard_sets fs
    WHERE fs.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione legacy per compatibilità
CREATE FUNCTION get_user_stats(user_uuid UUID)
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
