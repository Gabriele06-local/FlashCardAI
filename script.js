// Configurazione globale
const CONFIG = {
    DEFAULT_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    DEFAULT_API_KEY: 'AIzaSyCcjdVv_HDOH9RkrK5bmx6MVZAJO9Mqk5U', // Placeholder - da sostituire con una chiave reale
    STORAGE_KEY: 'flashcard_api_key',
    THEME_KEY: 'flashcard_theme',
    SAVED_SETS_KEY: 'flashcard_saved_sets'
};

// Stato dell'applicazione
let appState = {
    flashcards: [],
    currentIndex: 0,
    isLoading: false,
    apiKey: null,
    useCustomApi: false,
    answerRevealed: false
};

// Elementi DOM
const elements = {
    textInput: document.getElementById('textInput'),
    pdfInput: document.getElementById('pdfInput'),
    pdfInfo: document.getElementById('pdfInfo'),
    apiChoiceRadios: document.querySelectorAll('input[name="apiChoice"]'),
    customApiSection: document.getElementById('customApiSection'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    generateBtn: document.getElementById('generateBtn'),
    flashcardSection: document.getElementById('flashcardSection'),
    flashcardCounter: document.getElementById('flashcardCounter'),
    currentCard: document.getElementById('currentCard'),
    totalCards: document.getElementById('totalCards'),
    questionText: document.getElementById('questionText'),
    answerText: document.getElementById('answerText'),
    answerSection: document.getElementById('answerSection'),
    revealAnswerBtn: document.getElementById('revealAnswerBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    saveSetBtn: document.getElementById('saveSetBtn'),
    exportBtn: document.getElementById('exportBtn'),
    copyBtn: document.getElementById('copyBtn'),
    exportModal: document.getElementById('exportModal'),
    exportJson: document.getElementById('exportJson'),
    exportCsv: document.getElementById('exportCsv'),
    closeModal: document.getElementById('closeModal'),
    saveSetModal: document.getElementById('saveSetModal'),
    setNameInput: document.getElementById('setNameInput'),
    confirmSaveBtn: document.getElementById('confirmSaveBtn'),
    cancelSaveBtn: document.getElementById('cancelSaveBtn'),
    savedFlashcardsSection: document.getElementById('savedFlashcardsSection'),
    savedSetsGrid: document.getElementById('savedSetsGrid'),
    emptySavedSets: document.getElementById('emptySavedSets'),
    clearAllBtn: document.getElementById('clearAllBtn')
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadSavedData();
    loadSavedFlashcards();
});

// Inizializzazione dell'app
function initializeApp() {
    // Configura pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Aggiungi toggle tema
    addThemeToggle();
    
    console.log('Flashcard Generator inizializzato');
}

// Setup degli event listeners
function setupEventListeners() {
    // Input text
    elements.textInput.addEventListener('input', handleTextInput);
    
    // File PDF
    elements.pdfInput.addEventListener('change', handlePdfUpload);
    
    // API choice
    elements.apiChoiceRadios.forEach(radio => {
        radio.addEventListener('change', handleApiChoiceChange);
    });
    
    // Salva API key
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    
    // Genera flashcard
    elements.generateBtn.addEventListener('click', generateFlashcards);
    
    // Rivelare risposta
    elements.revealAnswerBtn.addEventListener('click', toggleAnswer);
    
    // Navigazione flashcard
    elements.prevBtn.addEventListener('click', showPreviousCard);
    elements.nextBtn.addEventListener('click', showNextCard);
    
    // Salvataggio e esportazione
    elements.saveSetBtn.addEventListener('click', showSaveSetModal);
    elements.exportBtn.addEventListener('click', showExportModal);
    elements.copyBtn.addEventListener('click', copyFlashcards);
    elements.exportJson.addEventListener('click', () => exportFlashcards('json'));
    elements.exportCsv.addEventListener('click', () => exportFlashcards('csv'));
    elements.closeModal.addEventListener('click', hideExportModal);
    
    // Modal salvataggio set
    elements.confirmSaveBtn.addEventListener('click', saveFlashcardSet);
    elements.cancelSaveBtn.addEventListener('click', hideSaveSetModal);
    elements.setNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveFlashcardSet();
        }
    });
    
    // Gestione flashcard salvate
    elements.clearAllBtn.addEventListener('click', clearAllSavedSets);
    
    // Chiudi modal cliccando fuori
    elements.exportModal.addEventListener('click', (e) => {
        if (e.target === elements.exportModal) {
            hideExportModal();
        }
    });
    
    elements.saveSetModal.addEventListener('click', (e) => {
        if (e.target === elements.saveSetModal) {
            hideSaveSetModal();
        }
    });
}

// Gestione input testo
function handleTextInput() {
    const text = elements.textInput.value.trim();
    if (text) {
        elements.pdfInput.value = '';
        elements.pdfInfo.classList.add('hidden');
    }
}

// Gestione upload PDF
async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        showError('Per favore seleziona un file PDF valido.');
        return;
    }
    
    try {
        showLoading(true);
        const text = await extractTextFromPdf(file);
        elements.textInput.value = text;
        elements.pdfInfo.textContent = `PDF caricato: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        elements.pdfInfo.classList.remove('hidden');
    } catch (error) {
        showError('Errore nella lettura del PDF: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Estrazione testo da PDF
async function extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                
                resolve(fullText.trim());
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Gestione cambio scelta API
function handleApiChoiceChange(event) {
    const useCustom = event.target.value === 'custom';
    appState.useCustomApi = useCustom;
    
    if (useCustom) {
        elements.customApiSection.classList.remove('hidden');
        elements.apiKeyInput.focus();
    } else {
        elements.customApiSection.classList.add('hidden');
    }
}

// Salva API key
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (!apiKey) {
        showError('Inserisci una API key valida.');
        return;
    }
    
    appState.apiKey = apiKey;
    localStorage.setItem(CONFIG.STORAGE_KEY, apiKey);
    showSuccess('API key salvata con successo!');
}

// Carica dati salvati
function loadSavedData() {
    // Carica API key
    const savedApiKey = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (savedApiKey) {
        appState.apiKey = savedApiKey;
        elements.apiKeyInput.value = savedApiKey;
    }
    
    // Carica tema
    const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Carica flashcard salvate
function loadSavedFlashcards() {
    const savedSets = getSavedSets();
    renderSavedSets(savedSets);
}

// Ottieni set salvati dal localStorage
function getSavedSets() {
    try {
        const saved = localStorage.getItem(CONFIG.SAVED_SETS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Errore nel caricamento dei set salvati:', error);
        return [];
    }
}

// Salva set nel localStorage
function saveSetsToStorage(sets) {
    try {
        localStorage.setItem(CONFIG.SAVED_SETS_KEY, JSON.stringify(sets));
    } catch (error) {
        console.error('Errore nel salvataggio dei set:', error);
        showError('Errore nel salvataggio delle flashcard.');
    }
}

// Renderizza i set salvati
function renderSavedSets(sets) {
    if (sets.length === 0) {
        elements.emptySavedSets.classList.remove('hidden');
        elements.savedSetsGrid.classList.add('hidden');
        return;
    }
    
    elements.emptySavedSets.classList.add('hidden');
    elements.savedSetsGrid.classList.remove('hidden');
    
    elements.savedSetsGrid.innerHTML = sets.map((set, index) => `
        <div class="saved-set-card" data-set-id="${set.id}">
            <div class="saved-set-title">${set.name}</div>
            <div class="saved-set-info">
                ${set.flashcards.length} flashcard • Creato il ${new Date(set.createdAt).toLocaleDateString('it-IT')}
            </div>
            <div class="saved-set-actions">
                <button class="btn-secondary" onclick="loadSavedSet('${set.id}')">📖 Apri</button>
                <button class="btn-secondary" onclick="deleteSavedSet('${set.id}')">🗑️ Elimina</button>
            </div>
        </div>
    `).join('');
}

// Genera flashcard
async function generateFlashcards() {
    const text = elements.textInput.value.trim();
    if (!text) {
        showError('Inserisci del testo o carica un PDF per generare le flashcard.');
        return;
    }
    
    // Verifica API key
    if (appState.useCustomApi && !appState.apiKey) {
        showError('Inserisci la tua API key per continuare.');
        return;
    }
    
    try {
        showLoading(true);
        const flashcards = await callApi(text);
        
        if (flashcards && flashcards.length > 0) {
            appState.flashcards = flashcards;
            appState.currentIndex = 0;
            appState.answerRevealed = false;
            showFlashcardSection();
            updateFlashcardDisplay();
            showSuccess(`Generate ${flashcards.length} flashcard con successo!`);
        } else {
            showError('Nessuna flashcard generata. Riprova con un testo diverso.');
        }
    } catch (error) {
        showError('Errore nella generazione delle flashcard: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Chiamata API
async function callApi(text) {
    const apiKey = appState.useCustomApi ? appState.apiKey : CONFIG.DEFAULT_API_KEY;
    const apiUrl = CONFIG.DEFAULT_API_URL;
    
    const prompt = `Genera flashcard con domande e risposte chiare e concise basate sul seguente testo. 
    Rispondi SOLO con un array JSON di oggetti con questa struttura esatta:
    [
        {"domanda": "testo della domanda", "risposta": "testo della risposta"},
        {"domanda": "testo della domanda", "risposta": "testo della risposta"}
    ]
    
    Testo da elaborare:
    ${text}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Errore API: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Estrai JSON dalla risposta
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Formato di risposta non valido dall\'API');
    }
    
    try {
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards.filter(card => card.domanda && card.risposta);
    } catch (error) {
        throw new Error('Errore nel parsing della risposta JSON');
    }
}

// Mostra sezione flashcard
function showFlashcardSection() {
    elements.flashcardSection.classList.remove('hidden');
    elements.flashcardSection.scrollIntoView({ behavior: 'smooth' });
}

// Aggiorna display flashcard
function updateFlashcardDisplay() {
    if (appState.flashcards.length === 0) return;
    
    const currentCard = appState.flashcards[appState.currentIndex];
    elements.questionText.textContent = currentCard.domanda;
    elements.answerText.textContent = currentCard.risposta;
    
    elements.currentCard.textContent = appState.currentIndex + 1;
    elements.totalCards.textContent = appState.flashcards.length;
    
    // Reset stato risposta
    appState.answerRevealed = false;
    elements.answerSection.classList.add('hidden');
    elements.revealAnswerBtn.classList.remove('hidden');
    elements.revealAnswerBtn.textContent = '👁️ Mostra Risposta';
    
    // Aggiorna stato bottoni navigazione
    elements.prevBtn.disabled = appState.currentIndex === 0;
    elements.nextBtn.disabled = appState.currentIndex === appState.flashcards.length - 1;
}

// Toggle risposta
function toggleAnswer() {
    appState.answerRevealed = !appState.answerRevealed;
    
    if (appState.answerRevealed) {
        elements.answerSection.classList.remove('hidden');
        elements.answerSection.classList.add('revealed');
        elements.revealAnswerBtn.textContent = '🙈 Nascondi Risposta';
    } else {
        elements.answerSection.classList.add('hidden');
        elements.answerSection.classList.remove('revealed');
        elements.revealAnswerBtn.textContent = '👁️ Mostra Risposta';
    }
}

// Mostra flashcard precedente
function showPreviousCard() {
    if (appState.currentIndex > 0) {
        appState.currentIndex--;
        updateFlashcardDisplay();
    }
}

// Mostra flashcard successiva
function showNextCard() {
    if (appState.currentIndex < appState.flashcards.length - 1) {
        appState.currentIndex++;
        updateFlashcardDisplay();
    }
}

// Mostra modal salvataggio set
function showSaveSetModal() {
    if (appState.flashcards.length === 0) {
        showError('Nessuna flashcard da salvare.');
        return;
    }
    
    elements.setNameInput.value = '';
    elements.saveSetModal.classList.remove('hidden');
    elements.setNameInput.focus();
}

// Nascondi modal salvataggio set
function hideSaveSetModal() {
    elements.saveSetModal.classList.add('hidden');
}

// Salva set di flashcard
function saveFlashcardSet() {
    const setName = elements.setNameInput.value.trim();
    if (!setName) {
        showError('Inserisci un nome per il set di flashcard.');
        return;
    }
    
    if (appState.flashcards.length === 0) {
        showError('Nessuna flashcard da salvare.');
        return;
    }
    
    const savedSets = getSavedSets();
    const newSet = {
        id: Date.now().toString(),
        name: setName,
        flashcards: [...appState.flashcards],
        createdAt: new Date().toISOString()
    };
    
    savedSets.push(newSet);
    saveSetsToStorage(savedSets);
    renderSavedSets(savedSets);
    
    hideSaveSetModal();
    showSuccess(`Set "${setName}" salvato con successo!`);
}

// Carica set salvato
function loadSavedSet(setId) {
    const savedSets = getSavedSets();
    const set = savedSets.find(s => s.id === setId);
    
    if (!set) {
        showError('Set non trovato.');
        return;
    }
    
    appState.flashcards = [...set.flashcards];
    appState.currentIndex = 0;
    appState.answerRevealed = false;
    
    showFlashcardSection();
    updateFlashcardDisplay();
    showSuccess(`Set "${set.name}" caricato con successo!`);
}

// Elimina set salvato
function deleteSavedSet(setId) {
    if (!confirm('Sei sicuro di voler eliminare questo set di flashcard?')) {
        return;
    }
    
    const savedSets = getSavedSets();
    const filteredSets = savedSets.filter(s => s.id !== setId);
    saveSetsToStorage(filteredSets);
    renderSavedSets(filteredSets);
    
    showSuccess('Set eliminato con successo!');
}

// Cancella tutti i set salvati
function clearAllSavedSets() {
    if (!confirm('Sei sicuro di voler eliminare tutti i set di flashcard salvati? Questa azione non può essere annullata.')) {
        return;
    }
    
    saveSetsToStorage([]);
    renderSavedSets([]);
    showSuccess('Tutti i set sono stati eliminati!');
}

// Mostra modal esportazione
function showExportModal() {
    elements.exportModal.classList.remove('hidden');
}

// Nascondi modal esportazione
function hideExportModal() {
    elements.exportModal.classList.add('hidden');
}

// Copia flashcard negli appunti
async function copyFlashcards() {
    if (appState.flashcards.length === 0) {
        showError('Nessuna flashcard da copiare.');
        return;
    }
    
    const text = appState.flashcards.map((card, index) => 
        `${index + 1}. Domanda: ${card.domanda}\n   Risposta: ${card.risposta}`
    ).join('\n\n');
    
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Flashcard copiate negli appunti!');
    } catch (error) {
        showError('Errore nella copia: ' + error.message);
    }
}

// Esporta flashcard
function exportFlashcards(format) {
    if (appState.flashcards.length === 0) {
        showError('Nessuna flashcard da esportare.');
        return;
    }
    
    let content, filename, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(appState.flashcards, null, 2);
        filename = 'flashcard.json';
        mimeType = 'application/json';
    } else if (format === 'csv') {
        const csvContent = [
            'Domanda,Risposta',
            ...appState.flashcards.map(card => 
                `"${card.domanda.replace(/"/g, '""')}","${card.risposta.replace(/"/g, '""')}"`
            )
        ].join('\n');
        content = csvContent;
        filename = 'flashcard.csv';
        mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideExportModal();
    showSuccess(`Flashcard esportate in formato ${format.toUpperCase()}!`);
}

// Mostra loading
function showLoading(show) {
    appState.isLoading = show;
    const btnText = elements.generateBtn.querySelector('.btn-text');
    const spinner = elements.generateBtn.querySelector('.loading-spinner');
    
    if (show) {
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        elements.generateBtn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        elements.generateBtn.disabled = false;
    }
}

// Mostra errore
function showError(message) {
    showNotification(message, 'error');
}

// Mostra successo
function showSuccess(message) {
    showNotification(message, 'success');
}

// Mostra notifica
function showNotification(message, type = 'info') {
    // Rimuovi notifiche esistenti
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Stili per la notifica
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    if (type === 'error') {
        notification.style.backgroundColor = 'var(--accent-danger)';
    } else if (type === 'success') {
        notification.style.backgroundColor = 'var(--accent-secondary)';
    } else {
        notification.style.backgroundColor = 'var(--accent-primary)';
    }
    
    document.body.appendChild(notification);
    
    // Anima l'entrata
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Rimuovi dopo 5 secondi
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Aggiungi toggle tema
function addThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Cambia tema');
    themeToggle.addEventListener('click', toggleTheme);
    document.body.appendChild(themeToggle);
}

// Toggle tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(CONFIG.THEME_KEY, newTheme);
}

// Gestione errori globali
window.addEventListener('error', (event) => {
    console.error('Errore globale:', event.error);
    showError('Si è verificato un errore inaspettato. Ricarica la pagina.');
});

// Gestione errori di rete
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejection non gestita:', event.reason);
    showError('Errore di connessione. Verifica la tua connessione internet.');
}); 