-- SQL opzionale per aggiungere colonne extra alla tabella study_sessions
-- Esegui questo solo se vuoi le funzionalità avanzate di tracking

-- Aggiungi colonne opzionali alla tabella study_sessions
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS response_time INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS study_mode TEXT DEFAULT 'spaced_repetition',
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'desktop';

-- Commenti per documentare le nuove colonne
COMMENT ON COLUMN study_sessions.response_time IS 'Tempo di risposta in secondi';
COMMENT ON COLUMN study_sessions.study_mode IS 'Modalità di studio utilizzata';
COMMENT ON COLUMN study_sessions.device_type IS 'Tipo di dispositivo utilizzato';
