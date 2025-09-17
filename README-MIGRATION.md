# 🚀 Flashcard Generator v2.0 - Migrazione a Supabase

## ✅ Completato

### 1. Setup Supabase
- ✅ Configurazione progetto Supabase
- ✅ Database schema con tabelle per flashcard, utenti e studio
- ✅ Row Level Security (RLS) policies
- ✅ Edge Function per generazione AI sicura

### 2. Frontend Aggiornato
- ✅ Integrazione autenticazione Supabase
- ✅ Modalità studio con ripetizione spaziata (SM-2)
- ✅ Salvataggio cloud delle flashcard
- ✅ Dashboard statistiche utente
- ✅ UI migliorata per autenticazione e studio

### 3. Funzionalità Nuove
- ✅ Sistema di autenticazione completo
- ✅ Ripetizione spaziata intelligente
- ✅ Rate limiting per API AI
- ✅ Statistiche di studio personalizzate
- ✅ Flashcard pubbliche/private

## 🛠️ Setup e Deploy

### 1. Configurazione Supabase

1. **Crea progetto Supabase:**
   ```bash
   # Vai su https://supabase.com
   # Crea nuovo progetto: "flashcard-generator"
   # Regione: Europe (Frankfurt)
   ```

2. **Configura database:**
   ```sql
   -- Esegui il contenuto di supabase/migrations/20240101000000_initial_schema.sql
   -- nel SQL Editor di Supabase
   ```

3. **Configura Edge Function:**
   ```bash
   # Installa Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link al progetto
   supabase link --project-ref YOUR_PROJECT_ID
   
   # Setta variabili d'ambiente
   supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
   
   # Deploy Edge Function
   supabase functions deploy generate-flashcards
   ```

### 2. Configurazione Frontend

1. **Aggiorna credenziali Supabase:**
   ```javascript
   // In js/supabase.js, sostituisci:
   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
   ```

2. **Installa dipendenze:**
   ```bash
   npm install
   ```

3. **Avvia in modalità sviluppo:**
   ```bash
   npm run dev
   ```

## 🎯 Funzionalità Principali

### Autenticazione
- Registrazione e login utenti
- Gestione sessioni sicure
- Logout automatico

### Generazione Flashcard
- **Modalità Cloud:** Usa Edge Function Supabase (sicura, rate-limited)
- **Modalità Fallback:** API diretta Gemini (per utenti non autenticati)
- Supporto PDF e testo
- Prompt intelligenti basati su difficoltà

### Modalità Studio
- **Ripetizione Spaziata:** Algoritmo SM-2 per ottimizzare l'apprendimento
- **Sistema di Rating:** 1-5 stelle per valutare la difficoltà
- **Statistiche:** Carte da ripassare, studiate oggi, progressi
- **Scheduling Intelligente:** Calcola automaticamente quando ripassare

### Gestione Dati
- **Cloud Storage:** Flashcard salvate su Supabase
- **Sincronizzazione:** Accesso da qualsiasi dispositivo
- **Backup Automatico:** Nessuna perdita di dati
- **Condivisione:** Flashcard pubbliche/private

## 📊 Database Schema

### Tabelle Principali

```sql
-- Set di flashcard
flashcard_sets (
  id, user_id, name, description, subject,
  created_at, updated_at, is_public, total_cards
)

-- Singole flashcard
flashcards (
  id, set_id, question, answer, difficulty,
  created_at, order_index
)

-- Sessioni di studio (ripetizione spaziata)
study_sessions (
  id, user_id, card_id, quality, ease_factor,
  interval_days, next_review_date, repetitions, studied_at
)

-- Tracking uso API
api_usage (
  id, user_id, tokens_used, request_date, created_at
)
```

## 🔒 Sicurezza

### Row Level Security (RLS)
- Utenti possono vedere solo le proprie flashcard
- Flashcard pubbliche visibili a tutti
- API usage tracking per utente
- Sessioni di studio private

### Rate Limiting
- 50 richieste AI/giorno per utente gratuito
- Tracking automatico dell'uso
- Messaggi informativi sui limiti

### Edge Functions
- API Key Gemini protetta lato server
- Validazione input robusta
- Error handling completo
- CORS configurato correttamente

## 🎨 UI/UX Miglioramenti

### Autenticazione
- Form login/registrazione elegante
- Statistiche utente in tempo reale
- Gestione sessioni trasparente

### Modalità Studio
- Interfaccia dedicata per lo studio
- Progress bar visiva
- Sistema di rating intuitivo
- Feedback immediato

### Responsive Design
- Ottimizzato per mobile e desktop
- Tema scuro/chiaro
- Animazioni fluide
- Accessibilità migliorata

## 🚀 Prossimi Passi

### Funzionalità Avanzate
- [ ] Dashboard analytics con grafici
- [ ] Modalità studio multiple (quiz, matching, etc.)
- [ ] Import/export avanzato
- [ ] Collaborazione su set condivisi
- [ ] Notifiche push per ripassi

### Performance
- [ ] Caching intelligente
- [ ] Lazy loading delle flashcard
- [ ] Ottimizzazione query database
- [ ] PWA con offline support

### Monetizzazione
- [ ] Piani premium
- [ ] Limiti più alti per utenti paganti
- [ ] Funzionalità avanzate premium
- [ ] Analytics dettagliati

## 🐛 Troubleshooting

### Problemi Comuni

1. **Errore di autenticazione:**
   - Verifica le credenziali Supabase
   - Controlla che RLS sia abilitato
   - Verifica le policies del database

2. **Edge Function non funziona:**
   - Controlla che GEMINI_API_KEY sia settata
   - Verifica i logs della function
   - Testa la function localmente

3. **Flashcard non si salvano:**
   - Verifica che l'utente sia autenticato
   - Controlla i permessi RLS
   - Verifica la connessione internet

### Logs e Debug

```bash
# Logs Edge Function
supabase functions logs generate-flashcards

# Test locale
supabase functions serve generate-flashcards

# Debug database
# Usa il SQL Editor in Supabase Dashboard
```

## 📞 Supporto

Per problemi o domande:
1. Controlla i logs della console browser
2. Verifica i logs Supabase
3. Testa le funzionalità una per una
4. Consulta la documentazione Supabase

---

**🎉 Congratulazioni!** Il tuo Flashcard Generator è ora una moderna web app con autenticazione, cloud storage e ripetizione spaziata intelligente!
