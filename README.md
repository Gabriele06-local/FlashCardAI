# Flashcard App

Applicazione di flashcard per l'apprendimento attraverso ripetizione spaziata. Genera automaticamente domande e risposte dal testo inserito.

## Funzionalità

- **Login/registrazione** con LocalStorage
- **Input di testo** per generare flashcard
- **Supporto per file PDF** (funzionalità futura)
- **Generazione automatica di flashcard** (simulata, in futuro userà Gemini 1.5 Flash)
- **Interfaccia interattiva di studio** con carte girabili
- **Sistema di ripetizione** per le carte risposte in modo errato

## Come usare

1. Registrati o accedi con un account
2. Incolla il testo da cui vuoi generare le flashcard
3. Clicca "Genera Flashcard"
4. Studia con le flashcard generate:
   - Leggi la domanda
   - Prova a rispondere mentalmente
   - Clicca "Mostra risposta" per verificare
   - Indica se hai risposto correttamente o meno
   - Le carte a cui hai risposto in modo errato verranno riproposte

## Tecnologie utilizzate

- HTML5
- CSS3 (con animazioni per il flip delle carte)
- JavaScript (vanilla)
- LocalStorage per la persistenza dei dati
- In futuro: integrazione con l'API di Gemini 1.5 Flash

## Installazione

Non è richiesta installazione, essendo un'applicazione web statica. Basta aprire il file `index.html` in un browser web moderno.

## Sviluppi futuri

- Integrazione vera dell'API di Gemini 1.5 Flash
- Conversione da PDF a testo
- Esportazione delle flashcard in vari formati
- Statistiche di apprendimento
- Interfaccia mobile migliorata 