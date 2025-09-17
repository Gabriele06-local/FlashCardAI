# Configurazione Edge Function per Flashcard Generator

## Problemi Identificati e Soluzioni

### 1. Errore 400 nell'Edge Function
**Causa**: Mancanza di variabili d'ambiente o configurazione errata
**Soluzione**: Configurare le seguenti variabili d'ambiente in Supabase:

```bash
# Nel dashboard Supabase > Settings > Edge Functions
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Fallback API non funzionante
**Causa**: API Key non configurata correttamente
**Soluzione**: Assicurarsi che l'API Key sia salvata correttamente nel localStorage

### 3. Autenticazione fallita
**Causa**: Token di autenticazione non valido o scaduto
**Soluzione**: Verificare che l'utente sia autenticato correttamente

## Passi per Risolvere

### 1. Configurare le variabili d'ambiente in Supabase
1. Vai al dashboard Supabase
2. Settings > Edge Functions
3. Aggiungi le variabili d'ambiente necessarie

### 2. Verificare la configurazione locale
```bash
# Avvia Supabase localmente
supabase start

# Verifica che l'Edge Function sia deployata
supabase functions list
```

### 3. Testare l'Edge Function
```bash
# Test locale
supabase functions serve generate-flashcards

# Test con curl
curl -X POST 'http://localhost:54321/functions/v1/generate-flashcards' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test text", "difficulty": "medio", "cardCount": 5}'
```

### 4. Configurare API Key per fallback
1. Ottieni una API Key da Google AI Studio
2. Salvala nell'app usando il campo "API Key personalizzata"
3. L'app userà questa come fallback se l'Edge Function non funziona

## Debug

### Log dell'Edge Function
Controlla i log in Supabase Dashboard > Edge Functions > generate-flashcards > Logs

### Errori comuni
- **"Configurazione Supabase mancante"**: Verifica SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
- **"API Key Gemini non configurata"**: Verifica GEMINI_API_KEY
- **"Autenticazione fallita"**: Verifica che l'utente sia loggato
- **"Risposta AI non valida"**: Problema con l'API Gemini, verifica la chiave

## Test di Funzionamento

1. **Test con utente autenticato**: L'app dovrebbe usare l'Edge Function
2. **Test con API Key**: L'app dovrebbe usare il fallback API diretto
3. **Test senza autenticazione**: L'app dovrebbe mostrare errore appropriato

## Note

- L'Edge Function ha rate limiting (50 richieste/giorno per utente gratuito)
- Il fallback API diretto richiede una API Key valida
- Entrambi i metodi generano flashcard in formato JSON compatibile
