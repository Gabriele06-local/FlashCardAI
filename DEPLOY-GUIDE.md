# 🚀 Guida Rapida Deploy - Flashcard Generator v2.0

## ⚡ Setup Veloce (5 minuti)

### 1. Supabase Setup
```bash
# 1. Vai su https://supabase.com e crea account
# 2. Crea nuovo progetto: "flashcard-generator"
# 3. Regione: Europe (Frankfurt)
# 4. Copia Project URL e Anon Key
```

### 2. Database Setup
```sql
-- Nel SQL Editor di Supabase, esegui:
-- (Copia tutto il contenuto di supabase/migrations/20240101000000_initial_schema.sql)
```

### 3. Edge Function Setup
```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Link progetto
supabase link --project-ref YOUR_PROJECT_ID

# Setta API Key Gemini
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key

# Deploy function
supabase functions deploy generate-flashcards
```

### 4. Frontend Setup
```bash
# Installa dipendenze
npm install

# Aggiorna credenziali in js/supabase.js
# Sostituisci YOUR_SUPABASE_URL e YOUR_SUPABASE_ANON_KEY

# Avvia in sviluppo
npm run dev
```

## 🔧 Configurazione Dettagliata

### File da Modificare

1. **js/supabase.js** - Linee 4-5:
```javascript
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key-here'
```

2. **supabase/functions/generate-flashcards/index.ts** - Linea 75:
```typescript
// Assicurati che GEMINI_API_KEY sia settata come secret
```

### Test Integrazione
```bash
# Test completo
npm run test

# Oppure nel browser console:
runSupabaseTests()
```

## 🌐 Deploy Produzione

### Opzione 1: Vercel (Raccomandato)
```bash
# Installa Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configura variabili d'ambiente in Vercel Dashboard
```

### Opzione 2: Netlify
```bash
# Build
npm run build

# Deploy cartella dist/ su Netlify
```

### Opzione 3: GitHub Pages
```bash
# Build
npm run build

# Push cartella dist/ su branch gh-pages
```

## 🔑 Variabili d'Ambiente

### Sviluppo
- `SUPABASE_URL` - URL del progetto Supabase
- `SUPABASE_ANON_KEY` - Chiave anonima Supabase
- `GEMINI_API_KEY` - Chiave API Gemini (solo per Edge Function)

### Produzione
Configura le stesse variabili nel tuo provider di hosting.

## ✅ Checklist Deploy

- [ ] Progetto Supabase creato
- [ ] Database schema applicato
- [ ] Edge Function deployata
- [ ] Credenziali Supabase aggiornate
- [ ] API Key Gemini configurata
- [ ] Test integrazione passati
- [ ] Build produzione funzionante
- [ ] Deploy su hosting completato

## 🐛 Troubleshooting

### Errore "Invalid API Key"
- Verifica che GEMINI_API_KEY sia settata correttamente
- Controlla che la chiave sia valida su Google AI Studio

### Errore "Row Level Security"
- Verifica che RLS sia abilitato su tutte le tabelle
- Controlla che le policies siano create correttamente

### Errore "CORS"
- Verifica che l'URL del frontend sia nella lista CORS di Supabase
- Controlla la configurazione CORS nell'Edge Function

### Edge Function non risponde
- Controlla i logs: `supabase functions logs generate-flashcards`
- Verifica che la function sia deployata: `supabase functions list`

## 📞 Supporto

1. **Logs Supabase:** Dashboard → Logs
2. **Logs Edge Function:** `supabase functions logs generate-flashcards`
3. **Test Browser:** Console → `runSupabaseTests()`
4. **Documentazione:** [Supabase Docs](https://supabase.com/docs)

---

**🎉 Una volta completato, avrai una moderna web app con:**
- ✅ Autenticazione sicura
- ✅ Cloud storage
- ✅ AI-powered flashcard generation
- ✅ Spaced repetition learning
- ✅ Real-time sync
