# 🚀 Guida al Deployment su Netlify

## Problema Risolto

Il messaggio di errore:
```
Uncaught TypeError: Failed to resolve module specifier "@supabase/supabase-js".
Relative references must start with either "/", "./", or "../".
```

È stato risolto configurando correttamente Vite per il build e deployment.

## Soluzione Implementata

### 1. Configurazione Vite Ottimizzata
- ✅ Build ottimizzato con chunk separati per Supabase
- ✅ Minificazione con Terser
- ✅ Source maps per debugging
- ✅ Configurazione per deployment

### 2. Configurazione Netlify
- ✅ File `netlify.toml` creato
- ✅ Redirect per SPA
- ✅ Headers di sicurezza
- ✅ Cache ottimizzato per assets

## Come Deployare su Netlify

### Opzione 1: Deploy Automatico (Raccomandato)

1. **Collega il repository GitHub a Netlify:**
   - Vai su [netlify.com](https://netlify.com)
   - Clicca "New site from Git"
   - Connetti il tuo repository GitHub

2. **Configurazione Build:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 18

3. **Deploy:**
   - Netlify farà automaticamente il build e deploy
   - Il file `netlify.toml` configurerà automaticamente tutto

### Opzione 2: Deploy Manuale

1. **Build Locale:**
   ```bash
   npm install
   npm run build
   ```

2. **Upload della cartella `dist`:**
   - Vai su Netlify
   - Clicca "Deploy manually"
   - Trascina la cartella `dist` nella zona di upload

## Verifica del Deployment

Dopo il deployment, verifica che:

1. ✅ Il sito si carica senza errori
2. ✅ L'autenticazione Supabase funziona
3. ✅ La generazione di flashcard funziona
4. ✅ Le analytics funzionano
5. ✅ Non ci sono errori nella console del browser

## Struttura del Build

```
dist/
├── index.html          # File HTML principale
├── assets/
│   ├── index-*.css     # CSS bundle
│   ├── index-*.js      # JavaScript principale
│   ├── supabase-*.js   # Chunk Supabase (cached)
│   └── charts-*.js     # Chunk grafici (se usato)
```

## Troubleshooting

### Se il deployment fallisce:

1. **Verifica Node.js version:**
   - Assicurati che Netlify usi Node.js 18+
   - Specificato nel `netlify.toml`

2. **Verifica le dipendenze:**
   ```bash
   npm install
   npm run build
   ```

3. **Controlla i log di build su Netlify:**
   - Vai su "Deploys" nel dashboard Netlify
   - Clicca sul deploy fallito per vedere i log

### Se il sito non funziona dopo il deployment:

1. **Verifica la console del browser:**
   - Apri DevTools (F12)
   - Controlla la tab Console per errori

2. **Verifica le variabili d'ambiente:**
   - Assicurati che le credenziali Supabase siano corrette
   - Controlla che l'Edge Function sia deployata

## Comandi Utili

```bash
# Build locale
npm run build

# Preview del build
npm run preview

# Development server
npm run dev

# Test
npm test
```

## Note Importanti

- ⚠️ **NON aprire mai `index.html` direttamente nel browser** - usa sempre il server di sviluppo o il build
- ✅ Il build risolve automaticamente tutti i moduli ES6
- ✅ Supabase è configurato correttamente per il deployment
- ✅ Tutti gli import funzionano correttamente nel build finale

## Supporto

Se hai problemi con il deployment, controlla:
1. I log di build su Netlify
2. La console del browser per errori JavaScript
3. La configurazione delle variabili d'ambiente
4. Lo stato dell'Edge Function Supabase
