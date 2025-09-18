// Entry point principale per Vite
import { 
    AuthManager, 
    FlashcardManager, 
    SpacedRepetition, 
    AnalyticsManager,
    generateFlashcardsWithAI,
    handleSupabaseError 
} from './js/supabase.js';

// Grafici gestiti con CSS semplici - Recharts rimosso per ridurre bundle size

// Configurazione globale
const CONFIG = {
    DEFAULT_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    // API Key rimosso per sicurezza - usa Edge Function Supabase
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
    answerRevealed: false,
    user: null,
    studyMode: false,
    studyCards: [],
    currentStudyIndex: 0,
    cardsStudiedToday: 0,
    studyStartTime: null,
    selectedStudyMode: null,
    quizData: [],
    matchingData: [],
    memoryData: [],
    speedData: [],
    quizScore: 0,
    matchingScore: 0,
    memoryScore: 0,
    speedScore: 0
};

// Elementi DOM
const elements = {
    // Autenticazione
    authSection: document.getElementById('authSection'),
    loginForm: document.getElementById('loginForm'),
    userInfo: document.getElementById('userInfo'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userEmail: document.getElementById('userEmail'),
    userStats: document.getElementById('userStats'),
    analyticsBtn: document.getElementById('analyticsBtn'),
    
    // Input
    textInput: document.getElementById('textInput'),
    pdfInput: document.getElementById('pdfInput'),
    pdfInfo: document.getElementById('pdfInfo'),
    apiChoiceRadios: document.querySelectorAll('input[name="apiChoice"]'),
    customApiSection: document.getElementById('customApiSection'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    generateBtn: document.getElementById('generateBtn'),
    
    // Flashcard
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
    
    // Analytics
    analyticsSection: document.getElementById('analyticsSection'),
    analyticsTimeframe: document.getElementById('analyticsTimeframe'),
    refreshAnalytics: document.getElementById('refreshAnalytics'),
    totalSets: document.getElementById('totalSets'),
    totalCards: document.getElementById('totalCards'),
    studyStreak: document.getElementById('studyStreak'),
    accuracyRate: document.getElementById('accuracyRate'),
    totalStudyTime: document.getElementById('totalStudyTime'),
    cardsDueToday: document.getElementById('cardsDueToday'),
    weeklyProgressChart: document.getElementById('weeklyProgressChart'),
    accuracyChart: document.getElementById('accuracyChart'),
    insightsList: document.getElementById('insightsList'),
    
    // Studio
    studySection: document.getElementById('studySection'),
    startStudyBtn: document.getElementById('startStudyBtn'),
    stopStudyBtn: document.getElementById('stopStudyBtn'),
    cardsDue: document.getElementById('cardsDue'),
    cardsStudied: document.getElementById('cardsStudied'),
    currentStudyMode: document.getElementById('currentStudyMode'),
    studyCard: document.getElementById('studyCard'),
    studyProgress: document.getElementById('studyProgress'),
    studyProgressText: document.getElementById('studyProgressText'),
    studyQuestionText: document.getElementById('studyQuestionText'),
    studyRevealBtn: document.getElementById('studyRevealBtn'),
    studyAnswer: document.getElementById('studyAnswer'),
    studyAnswerText: document.getElementById('studyAnswerText'),
    
    // Modalità Studio
    studyModeCards: document.querySelectorAll('.study-mode-card'),
    studyModeSelector: document.querySelector('.study-mode-selector'),
    
    // Quiz Mode
    quizMode: document.getElementById('quizMode'),
    quizQuestion: document.getElementById('quizQuestionText'),
    quizOptions: document.getElementById('quizOptions'),
    quizFeedback: document.getElementById('quizFeedback'),
    feedbackIcon: document.getElementById('feedbackIcon'),
    feedbackText: document.getElementById('feedbackText'),
    correctAnswer: document.getElementById('correctAnswer'),
    nextQuizBtn: document.getElementById('nextQuizBtn'),
    quizProgress: document.getElementById('quizProgress'),
    quizProgressText: document.getElementById('quizProgressText'),
    
    // Matching Mode
    matchingMode: document.getElementById('matchingMode'),
    matchingGrid: document.getElementById('matchingGrid'),
    matchingFeedback: document.getElementById('matchingFeedback'),
    matchingFeedbackIcon: document.getElementById('matchingFeedbackIcon'),
    matchingFeedbackText: document.getElementById('matchingFeedbackText'),
    matchingProgress: document.getElementById('matchingProgress'),
    matchingProgressText: document.getElementById('matchingProgressText'),
    
    // Memory Mode
    memoryMode: document.getElementById('memoryMode'),
    memoryGrid: document.getElementById('memoryGrid'),
    memoryAttempts: document.getElementById('memoryAttempts'),
    memoryPairs: document.getElementById('memoryPairs'),
    memoryProgress: document.getElementById('memoryProgress'),
    memoryProgressText: document.getElementById('memoryProgressText'),
    
    // Speed Mode
    speedMode: document.getElementById('speedMode'),
    speedQuestion: document.getElementById('speedQuestionText'),
    speedAnswer: document.getElementById('speedAnswerText'),
    speedTimer: document.getElementById('speedTimer'),
    revealSpeedAnswer: document.getElementById('revealSpeedAnswer'),
    speedNext: document.getElementById('speedNext'),
    speedProgress: document.getElementById('speedProgress'),
    speedProgressText: document.getElementById('speedProgressText'),
    
    // Flashcard salvate
    savedFlashcardsSection: document.getElementById('savedFlashcardsSection'),
    savedSetsGrid: document.getElementById('savedSetsGrid'),
    emptySavedSets: document.getElementById('emptySavedSets'),
    refreshSetsBtn: document.getElementById('refreshSetsBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    
    // Modal
    exportModal: document.getElementById('exportModal'),
    exportJson: document.getElementById('exportJson'),
    exportCsv: document.getElementById('exportCsv'),
    closeModal: document.getElementById('closeModal'),
    saveSetModal: document.getElementById('saveSetModal'),
    setNameInput: document.getElementById('setNameInput'),
    confirmSaveBtn: document.getElementById('confirmSaveBtn'),
    cancelSaveBtn: document.getElementById('cancelSaveBtn')
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadSavedData();
    checkAuthState();
});

// Inizializzazione dell'app
function initializeApp() {
    // Configura pdf.js con gestione errori
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } catch (error) {
        console.warn('PDF.js non disponibile:', error);
    }
    
    // Aggiungi toggle tema
    addThemeToggle();
    
    console.log('Flashcard Generator v2.0 inizializzato con Supabase');
}

// Setup degli event listeners
function setupEventListeners() {
    // Autenticazione
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.signupBtn.addEventListener('click', handleSignup);
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.analyticsBtn.addEventListener('click', showAnalyticsDashboard);
    
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
    
    // Analytics
    elements.analyticsTimeframe.addEventListener('change', loadAnalytics);
    elements.refreshAnalytics.addEventListener('click', loadAnalytics);
    
    // Studio
    elements.startStudyBtn.addEventListener('click', startStudyMode);
    elements.stopStudyBtn.addEventListener('click', stopStudyMode);
    elements.studyRevealBtn.addEventListener('click', revealStudyAnswer);
    
    // Rating buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('rating-btn')) {
            handleStudyRating(parseInt(e.target.dataset.quality));
        }
    });
    
    // Modalità Studio
    elements.studyModeCards.forEach(card => {
        card.addEventListener('click', selectStudyMode);
    });
    
    // Quiz Mode
    elements.nextQuizBtn.addEventListener('click', nextQuizQuestion);
    
    // Speed Mode
    elements.revealSpeedAnswer.addEventListener('click', revealSpeedAnswer);
    elements.speedNext.addEventListener('click', nextSpeedCard);
    
    // Gestione flashcard salvate
    elements.refreshSetsBtn.addEventListener('click', loadSavedFlashcards);
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

// Gestione autenticazione
async function checkAuthState() {
    const { user } = await AuthManager.getCurrentUser();
    if (user) {
        appState.user = user;
        showUserInfo();
        loadSavedFlashcards();
        updateStudyStats();
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    elements.loginForm.classList.remove('hidden');
    elements.userInfo.classList.add('hidden');
    appState.user = null;
    
    // Ripristina sezione API per utenti non loggati
    const apiSection = document.querySelector('.api-section');
    if (apiSection) {
        apiSection.style.opacity = '1';
        apiSection.style.pointerEvents = 'auto';
        // Rimuovi tooltip se presente
        const tooltip = apiSection.querySelector('.user-logged-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

function showUserInfo() {
    elements.loginForm.classList.add('hidden');
    elements.userInfo.classList.remove('hidden');
    elements.userEmail.textContent = appState.user.email;
    updateUserStats();
    
    // Nascondi sezione API personalizzata per utenti loggati
    const apiSection = document.querySelector('.api-section');
    if (apiSection) {
        apiSection.style.opacity = '0.6';
        apiSection.style.pointerEvents = 'none';
        // Aggiungi tooltip informativo
        if (!apiSection.querySelector('.user-logged-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.className = 'user-logged-tooltip';
            tooltip.innerHTML = '💡 Gli utenti loggati usano il sistema sicuro integrato';
            tooltip.style.cssText = 'font-size: 12px; color: #666; margin-top: 5px; text-align: center;';
            apiSection.appendChild(tooltip);
        }
    }
}

async function updateUserStats() {
    if (!appState.user) return;
    
    try {
        const { data, error } = await AnalyticsManager.getUserAnalytics(30);
        
        if (error) throw error;
        
        const stats = data || {};
        elements.userStats.textContent = `${stats.total_sets || 0} set • ${stats.total_cards || 0} carte`;
    } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
    }
}

async function handleLogin() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (!email || !password) {
        showError('Inserisci email e password.');
        return;
    }
    
    try {
        showLoading(true);
        const { data, error } = await AuthManager.signIn(email, password);
        
        if (error) throw error;
        
        appState.user = data.user;
        showUserInfo();
        loadSavedFlashcards();
        updateStudyStats();
        showSuccess('Accesso effettuato con successo!');
        
        // Pulisci i campi
        elements.emailInput.value = '';
        elements.passwordInput.value = '';
        
    } catch (error) {
        showError(handleSupabaseError(error));
    } finally {
        showLoading(false);
    }
}

async function handleSignup() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (!email || !password) {
        showError('Inserisci email e password.');
        return;
    }
    
    if (password.length < 6) {
        showError('La password deve essere di almeno 6 caratteri.');
        return;
    }
    
    try {
        showLoading(true);
        const { data, error } = await AuthManager.signUp(email, password);
        
        if (error) throw error;
        
        showSuccess('Registrazione completata! Controlla la tua email per confermare l\'account.');
        
        // Pulisci i campi
        elements.emailInput.value = '';
        elements.passwordInput.value = '';
        
    } catch (error) {
        showError(handleSupabaseError(error));
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        const { error } = await AuthManager.signOut();
        if (error) throw error;
        
        appState.user = null;
        showLoginForm();
        showSuccess('Logout effettuato con successo!');
        
    } catch (error) {
        showError(handleSupabaseError(error));
    }
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
    
    // Se l'utente è loggato, non permettere l'uso di API personalizzate
    if (appState.user && useCustom) {
        showError('Gli utenti loggati usano il sistema sicuro integrato. API personalizzata non necessaria.');
        // Torna alla scelta default
        document.querySelector('input[name="apiChoice"][value="default"]').checked = true;
        appState.useCustomApi = false;
        return;
    }
    
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

// Genera flashcard
async function generateFlashcards() {
    const text = elements.textInput.value.trim();
    if (!text) {
        showError('Inserisci del testo o carica un PDF per generare le flashcard.');
        return;
    }
    
    // Verifica API key se si usa API personalizzata
    if (appState.useCustomApi && !appState.apiKey) {
        showError('Inserisci la tua API key per continuare.');
        return;
    }
    
    try {
        showLoading(true, 'Analisi del testo in corso...');
        let flashcards;
        
        if (appState.user) {
            // Usa sempre Edge Function per utenti autenticati (sicuro)
            showLoading(true, 'Generazione AI in corso...');
            try {
                const { data, error } = await generateFlashcardsWithAI(text, 'medio', '', 10);
                if (error) throw error;
                flashcards = data.flashcards;
            } catch (edgeError) {
                console.warn('Edge Function non disponibile, fallback a API diretta:', edgeError);
                // Fallback a API diretta se Edge Function non funziona
                if (appState.apiKey) {
                    try {
                        flashcards = await callApi(text);
                    } catch (apiError) {
                        throw new Error(`Edge Function e API diretta non disponibili: ${apiError.message}`);
                    }
                } else {
                    throw new Error('Edge Function non disponibile e nessuna API key fornita. Configura una API key per il fallback.');
                }
            }
        } else if (appState.useCustomApi && appState.apiKey) {
            // Solo per utenti non autenticati con API key personale
            showLoading(true, 'Chiamata API in corso...');
            flashcards = await callApi(text);
        } else {
            throw new Error('Devi effettuare l\'accesso o fornire una API key per generare flashcard.');
        }
        
        showLoading(true, 'Validazione flashcard...');
        
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

// Chiamata API (fallback)
async function callApi(text) {
    const apiKey = appState.apiKey;
    const apiUrl = CONFIG.DEFAULT_API_URL;
    
    if (!apiKey) {
        throw new Error('API Key non configurata per il fallback');
    }
    
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
    
    if (!appState.user) {
        showError('Devi effettuare l\'accesso per salvare le flashcard.');
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
async function saveFlashcardSet() {
    const setName = elements.setNameInput.value.trim();
    if (!setName) {
        showError('Inserisci un nome per il set di flashcard.');
        return;
    }
    
    if (appState.flashcards.length === 0) {
        showError('Nessuna flashcard da salvare.');
        return;
    }
    
    if (!appState.user) {
        showError('Devi effettuare l\'accesso per salvare le flashcard.');
        return;
    }
    
    try {
        showLoading(true);
        
        // Crea il set
        const { data: setData, error: setError } = await FlashcardManager.createFlashcardSet(
            setName,
            `Set generato il ${new Date().toLocaleDateString('it-IT')}`,
            'Generale'
        );
        
        if (setError) throw setError;
        
        // Aggiungi le flashcard
        const { error: cardsError } = await FlashcardManager.addFlashcards(
            setData.id,
            appState.flashcards
        );
        
        if (cardsError) throw cardsError;
        
        hideSaveSetModal();
        showSuccess(`Set "${setName}" salvato con successo!`);
        loadSavedFlashcards();
        updateUserStats();
        
    } catch (error) {
        showError(handleSupabaseError(error));
    } finally {
        showLoading(false);
    }
}

// Carica flashcard salvate
async function loadSavedFlashcards() {
    if (!appState.user) {
        elements.emptySavedSets.classList.remove('hidden');
        elements.savedSetsGrid.classList.add('hidden');
        return;
    }
    
    try {
        const { data, error } = await FlashcardManager.getUserFlashcardSets();
        if (error) throw error;
        
        renderSavedSets(data || []);
        
    } catch (error) {
        console.error('Errore nel caricamento delle flashcard salvate:', error);
        showError(handleSupabaseError(error));
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
    
    elements.savedSetsGrid.innerHTML = sets.map((set) => `
        <div class="saved-set-card" data-set-id="${set.id}">
            <div class="saved-set-title">${set.name}</div>
            <div class="saved-set-info">
                ${set.total_cards} flashcard • Creato il ${new Date(set.created_at).toLocaleDateString('it-IT')}
                ${set.is_public ? ' • 🌐 Pubblico' : ''}
            </div>
            <div class="saved-set-actions">
                <button class="btn-secondary" data-action="load" data-set-id="${set.id}">📖 Apri</button>
                <button class="btn-secondary" data-action="delete" data-set-id="${set.id}">🗑️ Elimina</button>
            </div>
        </div>
    `).join('');
    
    // Aggiungi event listeners per i pulsanti
    elements.savedSetsGrid.querySelectorAll('[data-action="load"]').forEach(btn => {
        btn.addEventListener('click', () => loadSavedSet(btn.dataset.setId));
    });
    
    elements.savedSetsGrid.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => deleteSavedSet(btn.dataset.setId));
    });
}

// Carica set salvato
async function loadSavedSet(setId) {
    try {
        const { data, error } = await FlashcardManager.getFlashcardSet(setId);
        if (error) throw error;
        
        if (!data) {
            showError('Set non trovato.');
            return;
        }
        
        // Converti il formato Supabase al formato dell'app
        appState.flashcards = data.flashcards.map(card => ({
            domanda: card.question,
            risposta: card.answer,
            difficulty: card.difficulty
        }));
        
        appState.currentIndex = 0;
        appState.answerRevealed = false;
        
        showFlashcardSection();
        updateFlashcardDisplay();
        showSuccess(`Set "${data.name}" caricato con successo!`);
        
    } catch (error) {
        showError(handleSupabaseError(error));
    }
}

// Elimina set salvato
async function deleteSavedSet(setId) {
    if (!confirm('Sei sicuro di voler eliminare questo set di flashcard?')) {
        return;
    }
    
    try {
        const { error } = await FlashcardManager.deleteFlashcardSet(setId);
        if (error) throw error;
        
        showSuccess('Set eliminato con successo!');
        loadSavedFlashcards();
        updateUserStats();
        
    } catch (error) {
        showError(handleSupabaseError(error));
    }
}

// Cancella tutti i set salvati
async function clearAllSavedSets() {
    if (!confirm('Sei sicuro di voler eliminare tutti i set di flashcard salvati? Questa azione non può essere annullata.')) {
        return;
    }
    
    try {
        const { data: sets, error: fetchError } = await FlashcardManager.getUserFlashcardSets();
        if (fetchError) throw fetchError;
        
        // Elimina tutti i set
        for (const set of sets) {
            const { error } = await FlashcardManager.deleteFlashcardSet(set.id);
            if (error) throw error;
        }
        
        showSuccess('Tutti i set sono stati eliminati!');
        loadSavedFlashcards();
        updateUserStats();
        
    } catch (error) {
        showError(handleSupabaseError(error));
    }
}

// Modalità Studio
async function updateStudyStats() {
    if (!appState.user) return;
    
    try {
        const { data, error } = await AnalyticsManager.getUserAnalytics(30);
        
        if (error) throw error;
        
        const stats = data || {};
        elements.cardsDue.textContent = stats.cards_due_today || 0;
        elements.cardsStudied.textContent = stats.total_study_sessions || 0;
        
    } catch (error) {
        console.error('Errore nel caricamento delle statistiche di studio:', error);
    }
}

// Selezione modalità studio
function selectStudyMode(event) {
    const mode = event.currentTarget.dataset.mode;
    
    // Rimuovi selezione precedente
    elements.studyModeCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // Seleziona modalità corrente
    event.currentTarget.classList.add('selected');
    appState.selectedStudyMode = mode;
    
    // Mostra pulsante inizia studio
    elements.startStudyBtn.classList.remove('hidden');
    
    // Aggiorna modalità corrente
    const modeNames = {
        'spaced': 'Ripetizione Spaziata',
        'quiz': 'Quiz Mode',
        'matching': 'Matching',
        'memory': 'Memory Game',
        'speed': 'Speed Review'
    };
    
    elements.currentStudyMode.textContent = modeNames[mode] || '-';
}

async function startStudyMode() {
    if (!appState.user) {
        showError('Devi effettuare l\'accesso per usare la modalità studio.');
        return;
    }
    
    if (!appState.selectedStudyMode) {
        showError('Seleziona una modalità di studio prima di iniziare.');
        return;
    }
    
    try {
        showLoading(true);
        
        // Nascondi selettore modalità
        elements.studyModeSelector.classList.add('hidden');
        
        // Carica dati per la modalità selezionata
        await loadStudyModeData();
        
        appState.studyMode = true;
        appState.studyStartTime = Date.now();
        appState.cardsStudiedToday = 0;
        
        elements.startStudyBtn.classList.add('hidden');
        elements.stopStudyBtn.classList.remove('hidden');
        
        // Avvia modalità specifica
        startSpecificStudyMode();
        
    } catch (error) {
        console.error('Errore modalità studio:', error);
        showError('Errore nella modalità studio. Verifica la configurazione del database.');
    } finally {
        showLoading(false);
    }
}

async function loadStudyModeData() {
    if (appState.selectedStudyMode === 'spaced') {
        // Modalità ripetizione spaziata - usa dati dal database
        const { data, error } = await AnalyticsManager.getCardsForReview();
        
        if (error) {
            console.warn('Modalità studio non disponibile, database non configurato:', error);
            throw new Error('Modalità studio non disponibile. Configura il database per abilitare la ripetizione spaziata.');
        }
        
        if (!data || data.length === 0) {
            throw new Error('Nessuna carta da ripassare oggi! 🎉');
        }
        
        appState.studyCards = data;
        appState.currentStudyIndex = 0;
        
    } else {
        // Altre modalità - usa flashcard salvate
        const { data, error } = await FlashcardManager.getUserFlashcardSets();
        
        if (error || !data || data.length === 0) {
            throw new Error('Nessuna flashcard salvata disponibile per questa modalità.');
        }
        
        // Mostra selezione set se ci sono più set disponibili
        let selectedSet;
        if (data.length === 1) {
            selectedSet = data[0];
        } else {
            selectedSet = await showSetSelectionModal(data);
            if (!selectedSet) {
                throw new Error('Nessun set selezionato.');
            }
        }
        
        const { data: setData, error: setError } = await FlashcardManager.getFlashcardSet(selectedSet.id);
        
        if (setError || !setData || !setData.flashcards || setData.flashcards.length === 0) {
            throw new Error('Nessuna flashcard disponibile nel set selezionato.');
        }
        
        const flashcards = setData.flashcards;
        
        // Prepara dati per modalità specifiche
        switch (appState.selectedStudyMode) {
            case 'quiz':
                appState.quizData = prepareQuizData(flashcards);
                break;
            case 'matching':
                appState.matchingData = prepareMatchingData(flashcards);
                break;
            case 'memory':
                appState.memoryData = prepareMemoryData(flashcards);
                break;
            case 'speed':
                appState.speedData = prepareSpeedData(flashcards);
                break;
        }
        
        appState.currentStudyIndex = 0;
    }
}

function startSpecificStudyMode() {
    switch (appState.selectedStudyMode) {
        case 'spaced':
            elements.studyCard.classList.remove('hidden');
            showStudyCard();
            break;
        case 'quiz':
            elements.quizMode.classList.remove('hidden');
            startQuizMode();
            break;
        case 'matching':
            elements.matchingMode.classList.remove('hidden');
            startMatchingMode();
            break;
        case 'memory':
            elements.memoryMode.classList.remove('hidden');
            startMemoryMode();
            break;
        case 'speed':
            elements.speedMode.classList.remove('hidden');
            startSpeedMode();
            break;
    }
}

// ===== PREPARAZIONE DATI MODALITÀ =====

function prepareQuizData(flashcards) {
    return flashcards.map(card => ({
        question: card.question,
        correctAnswer: card.answer,
        options: generateQuizOptions(card.answer, flashcards),
        difficulty: card.difficulty || 2
    }));
}

function generateQuizOptions(correctAnswer, allCards) {
    const options = [correctAnswer];
    const otherAnswers = allCards
        .filter(card => card.answer !== correctAnswer)
        .map(card => card.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    
    options.push(...otherAnswers);
    return options.sort(() => Math.random() - 0.5);
}

function prepareMatchingData(flashcards) {
    const questions = flashcards.map(card => card.question);
    const answers = flashcards.map(card => card.answer);
    
    return {
        questions: questions.sort(() => Math.random() - 0.5),
        answers: answers.sort(() => Math.random() - 0.5),
        pairs: flashcards.map(card => ({
            question: card.question,
            answer: card.answer
        }))
    };
}

function prepareMemoryData(flashcards) {
    const cards = [];
    flashcards.forEach((card, index) => {
        cards.push({
            id: `q${index}`,
            content: card.question,
            type: 'question',
            pairId: index
        });
        cards.push({
            id: `a${index}`,
            content: card.answer,
            type: 'answer',
            pairId: index
        });
    });
    
    return cards.sort(() => Math.random() - 0.5);
}

function prepareSpeedData(flashcards) {
    return flashcards.map(card => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty || 2
    }));
}

// ===== QUIZ MODE =====

function startQuizMode() {
    appState.quizScore = 0;
    appState.currentStudyIndex = 0;
    showQuizQuestion();
}

function showQuizQuestion() {
    const currentQuiz = appState.quizData[appState.currentStudyIndex];
    if (!currentQuiz) {
        endQuizMode();
        return;
    }
    
    // Aggiorna progresso
    const progress = ((appState.currentStudyIndex + 1) / appState.quizData.length) * 100;
    elements.quizProgress.style.width = `${progress}%`;
    elements.quizProgressText.textContent = `${appState.currentStudyIndex + 1} di ${appState.quizData.length}`;
    
    // Mostra domanda
    elements.quizQuestion.textContent = currentQuiz.question;
    
    // Genera opzioni
    elements.quizOptions.innerHTML = '';
    currentQuiz.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'quiz-option';
        optionBtn.textContent = option;
        optionBtn.dataset.answer = option;
        optionBtn.addEventListener('click', selectQuizAnswer);
        elements.quizOptions.appendChild(optionBtn);
    });
    
    // Nascondi feedback
    elements.quizFeedback.classList.add('hidden');
}

function selectQuizAnswer(event) {
    const selectedAnswer = event.target.dataset.answer;
    const currentQuiz = appState.quizData[appState.currentStudyIndex];
    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
    
    // Disabilita tutte le opzioni
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === currentQuiz.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.dataset.answer === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Mostra feedback
    if (isCorrect) {
        appState.quizScore++;
        elements.feedbackIcon.textContent = '✅';
        elements.feedbackText.textContent = 'Corretto!';
        elements.correctAnswer.textContent = '';
    } else {
        elements.feedbackIcon.textContent = '❌';
        elements.feedbackText.textContent = 'Sbagliato!';
        elements.correctAnswer.textContent = `Risposta corretta: ${currentQuiz.correctAnswer}`;
    }
    
    elements.quizFeedback.classList.remove('hidden');
}

function nextQuizQuestion() {
    appState.currentStudyIndex++;
    if (appState.currentStudyIndex < appState.quizData.length) {
        showQuizQuestion();
    } else {
        endQuizMode();
    }
}

function endQuizMode() {
    const percentage = Math.round((appState.quizScore / appState.quizData.length) * 100);
    showSuccess(`Quiz completato! Punteggio: ${appState.quizScore}/${appState.quizData.length} (${percentage}%)`);
    stopStudyMode();
}

// ===== MATCHING MODE =====

function startMatchingMode() {
    appState.matchingScore = 0;
    appState.currentStudyIndex = 0;
    showMatchingGame();
}

function showMatchingGame() {
    const data = appState.matchingData;
    
    // Aggiorna progresso
    const progress = (appState.matchingScore / data.pairs.length) * 100;
    elements.matchingProgress.style.width = `${progress}%`;
    elements.matchingProgressText.textContent = `${appState.matchingScore} di ${data.pairs.length}`;
    
    // Genera griglia
    elements.matchingGrid.innerHTML = '';
    
    // Colonna domande
    const questionsColumn = document.createElement('div');
    questionsColumn.className = 'matching-column';
    questionsColumn.innerHTML = '<h4>Domande</h4>';
    
    data.questions.forEach((question, index) => {
        const item = document.createElement('div');
        item.className = 'matching-item';
        item.textContent = question;
        item.dataset.type = 'question';
        item.dataset.index = index;
        item.addEventListener('click', selectMatchingItem);
        questionsColumn.appendChild(item);
    });
    
    // Colonna risposte
    const answersColumn = document.createElement('div');
    answersColumn.className = 'matching-column';
    answersColumn.innerHTML = '<h4>Risposte</h4>';
    
    data.answers.forEach((answer, index) => {
        const item = document.createElement('div');
        item.className = 'matching-item';
        item.textContent = answer;
        item.dataset.type = 'answer';
        item.dataset.index = index;
        item.addEventListener('click', selectMatchingItem);
        answersColumn.appendChild(item);
    });
    
    elements.matchingGrid.appendChild(questionsColumn);
    elements.matchingGrid.appendChild(answersColumn);
    
    // Nascondi feedback
    elements.matchingFeedback.classList.add('hidden');
}

let selectedMatchingItem = null;

function selectMatchingItem(event) {
    const item = event.target;
    
    if (item.classList.contains('matched')) return;
    
    if (!selectedMatchingItem) {
        // Prima selezione
        selectedMatchingItem = item;
        item.classList.add('selected');
    } else {
        // Seconda selezione
        if (selectedMatchingItem === item) {
            // Deseleziona se stesso
            selectedMatchingItem.classList.remove('selected');
            selectedMatchingItem = null;
            return;
        }
        
        // Controlla se è una coppia corretta
        const isCorrect = checkMatchingPair(selectedMatchingItem, item);
        
        if (isCorrect) {
            selectedMatchingItem.classList.add('matched');
            item.classList.add('matched');
            appState.matchingScore++;
            
            // Mostra feedback positivo
            elements.matchingFeedbackIcon.textContent = '✅';
            elements.matchingFeedbackText.textContent = 'Perfetto!';
            elements.matchingFeedback.classList.remove('hidden');
            
            // Aggiorna progresso
            const progress = (appState.matchingScore / appState.matchingData.pairs.length) * 100;
            elements.matchingProgress.style.width = `${progress}%`;
            elements.matchingProgressText.textContent = `${appState.matchingScore} di ${appState.matchingData.pairs.length}`;
            
            // Controlla se completato
            if (appState.matchingScore === appState.matchingData.pairs.length) {
                setTimeout(() => {
                    showSuccess(`Matching completato! Tutte le coppie trovate! 🎉`);
                    stopStudyMode();
                }, 1000);
            }
        } else {
            // Mostra feedback negativo
            elements.matchingFeedbackIcon.textContent = '❌';
            elements.matchingFeedbackText.textContent = 'Prova ancora!';
            elements.matchingFeedback.classList.remove('hidden');
            
            // Rimuovi selezione dopo un po'
            setTimeout(() => {
                selectedMatchingItem.classList.remove('selected');
                item.classList.remove('selected');
            }, 1000);
        }
        
        selectedMatchingItem = null;
    }
}

function checkMatchingPair(questionItem, answerItem) {
    const questionText = questionItem.textContent;
    const answerText = answerItem.textContent;
    
    return appState.matchingData.pairs.some(pair => 
        pair.question === questionText && pair.answer === answerText
    );
}

// ===== MEMORY MODE =====

function startMemoryMode() {
    appState.memoryScore = 0;
    appState.memoryAttempts = 0;
    appState.memoryPairs = 0;
    appState.currentStudyIndex = 0;
    showMemoryGame();
}

function showMemoryGame() {
    const data = appState.memoryData;
    
    // Aggiorna progresso
    const progress = (appState.memoryPairs / (data.length / 2)) * 100;
    elements.memoryProgress.style.width = `${progress}%`;
    elements.memoryProgressText.textContent = `${appState.memoryPairs} di ${data.length / 2}`;
    
    // Aggiorna statistiche
    elements.memoryAttempts.textContent = appState.memoryAttempts;
    elements.memoryPairs.textContent = appState.memoryPairs;
    
    // Genera griglia
    elements.memoryGrid.innerHTML = '';
    
    data.forEach((card, index) => {
        const memoryCard = document.createElement('div');
        memoryCard.className = 'memory-card';
        memoryCard.dataset.index = index;
        memoryCard.dataset.pairId = card.pairId;
        memoryCard.dataset.type = card.type;
        memoryCard.addEventListener('click', flipMemoryCard);
        elements.memoryGrid.appendChild(memoryCard);
    });
}

let flippedCards = [];
let memoryLocked = false;

function flipMemoryCard(event) {
    if (memoryLocked) return;
    
    const card = event.target;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    // Mostra contenuto
    const cardData = appState.memoryData[card.dataset.index];
    card.textContent = cardData.content;
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        memoryLocked = true;
        appState.memoryAttempts++;
        elements.memoryAttempts.textContent = appState.memoryAttempts;
        
        const [card1, card2] = flippedCards;
        
        if (card1.dataset.pairId === card2.dataset.pairId) {
            // Coppia corretta
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                appState.memoryPairs++;
                elements.memoryPairs.textContent = appState.memoryPairs;
                
                // Aggiorna progresso
                const progress = (appState.memoryPairs / (appState.memoryData.length / 2)) * 100;
                elements.memoryProgress.style.width = `${progress}%`;
                elements.memoryProgressText.textContent = `${appState.memoryPairs} di ${appState.memoryData.length / 2}`;
                
                // Controlla se completato
                if (appState.memoryPairs === appState.memoryData.length / 2) {
                    setTimeout(() => {
                        showSuccess(`Memory completato! ${appState.memoryAttempts} tentativi! 🎉`);
                        stopStudyMode();
                    }, 1000);
                }
                
                memoryLocked = false;
            }, 500);
        } else {
            // Coppia sbagliata
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                card1.textContent = '';
                card2.textContent = '';
                memoryLocked = false;
            }, 1000);
        }
        
        flippedCards = [];
    }
}

// ===== SPEED MODE =====

function startSpeedMode() {
    appState.speedScore = 0;
    appState.currentStudyIndex = 0;
    showSpeedCard();
}

function showSpeedCard() {
    const currentCard = appState.speedData[appState.currentStudyIndex];
    if (!currentCard) {
        endSpeedMode();
        return;
    }
    
    // Aggiorna progresso
    const progress = ((appState.currentStudyIndex + 1) / appState.speedData.length) * 100;
    elements.speedProgress.style.width = `${progress}%`;
    elements.speedProgressText.textContent = `${appState.currentStudyIndex + 1} di ${appState.speedData.length}`;
    
    // Mostra domanda
    elements.speedQuestion.textContent = currentCard.question;
    elements.speedAnswer.classList.add('hidden');
    elements.speedAnswer.textContent = currentCard.answer;
    
    // Reset controlli
    elements.revealSpeedAnswer.classList.remove('hidden');
    elements.speedNext.classList.add('hidden');
    
    // Avvia timer
    startSpeedTimer();
}

let speedTimerInterval = null;

function startSpeedTimer() {
    let timeLeft = 5;
    elements.speedTimer.textContent = timeLeft;
    
    speedTimerInterval = setInterval(() => {
        timeLeft--;
        elements.speedTimer.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(speedTimerInterval);
            revealSpeedAnswer();
        }
    }, 1000);
}

function revealSpeedAnswer() {
    if (speedTimerInterval) {
        clearInterval(speedTimerInterval);
    }
    
    elements.speedAnswer.classList.remove('hidden');
    elements.revealSpeedAnswer.classList.add('hidden');
    elements.speedNext.classList.remove('hidden');
}

function nextSpeedCard() {
    appState.currentStudyIndex++;
    if (appState.currentStudyIndex < appState.speedData.length) {
        showSpeedCard();
    } else {
        endSpeedMode();
    }
}

function endSpeedMode() {
    showSuccess(`Speed Review completato! ${appState.speedData.length} carte riviste! ⚡`);
    stopStudyMode();
}

async function stopStudyMode() {
    if (appState.studyMode && appState.studyStartTime) {
        // Salva la sessione di studio
        try {
            const studyTime = Math.round((Date.now() - appState.studyStartTime) / 1000);
            const mode = appState.selectedStudyMode || 'spaced_repetition';
            
            await AnalyticsManager.recordStudySession({
                session_end: new Date().toISOString(),
                cards_studied: appState.cardsStudiedToday,
                correct_answers: appState.cardsStudiedToday, // Semplificato per ora
                total_time_seconds: studyTime,
                study_mode: mode
            });
        } catch (error) {
            console.error('Errore nel salvataggio della sessione:', error);
        }
    }
    
    // Reset stato studio
    appState.studyMode = false;
    appState.studyCards = [];
    appState.currentStudyIndex = 0;
    appState.studyStartTime = null;
    appState.cardsStudiedToday = 0;
    appState.selectedStudyMode = null;
    
    // Nascondi tutte le modalità
    elements.studyCard.classList.add('hidden');
    elements.studyAnswer.classList.add('hidden');
    elements.quizMode.classList.add('hidden');
    elements.matchingMode.classList.add('hidden');
    elements.memoryMode.classList.add('hidden');
    elements.speedMode.classList.add('hidden');
    
    // Mostra selettore modalità
    elements.studyModeSelector.classList.remove('hidden');
    
    // Reset selezione modalità
    elements.studyModeCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // Mostra controlli
    elements.startStudyBtn.classList.add('hidden');
    elements.stopStudyBtn.classList.add('hidden');
    
    // Aggiorna modalità corrente
    elements.currentStudyMode.textContent = '-';
    
    // Aggiorna statistiche
    updateStudyStats();
}

function showStudyCard() {
    if (appState.currentStudyIndex >= appState.studyCards.length) {
        showSuccess('Hai completato tutte le carte per oggi! 🎉');
        stopStudyMode();
        updateStudyStats();
        return;
    }
    
    const card = appState.studyCards[appState.currentStudyIndex];
    
    elements.studyQuestionText.textContent = card.question;
    elements.studyAnswerText.textContent = card.answer;
    elements.studyAnswer.classList.add('hidden');
    elements.studyRevealBtn.classList.remove('hidden');
    elements.studyRevealBtn.textContent = 'Mostra Risposta';
    
    // Aggiorna progresso
    const progress = ((appState.currentStudyIndex + 1) / appState.studyCards.length) * 100;
    elements.studyProgress.style.width = `${progress}%`;
    elements.studyProgressText.textContent = `${appState.currentStudyIndex + 1} di ${appState.studyCards.length}`;
}

function revealStudyAnswer() {
    elements.studyAnswer.classList.remove('hidden');
    elements.studyRevealBtn.classList.add('hidden');
}

async function handleStudyRating(quality) {
    const card = appState.studyCards[appState.currentStudyIndex];
    
    try {
        // Calcola tempo di risposta
        const responseTime = appState.studyStartTime ? 
            Math.round((Date.now() - appState.studyStartTime) / 1000) : null;
        
        // Usa algoritmo ripetizione spaziata avanzato
        const { error } = await SpacedRepetition.recordStudySession(card.card_id, quality, {
            responseTime: responseTime,
            mode: appState.selectedStudyMode || 'spaced_repetition',
            deviceType: 'desktop'
        });
        
        if (error) throw error;
        
        appState.cardsStudiedToday++;
        appState.currentStudyIndex++;
        
        // Prossima carta o fine sessione
        if (appState.currentStudyIndex < appState.studyCards.length) {
            showStudyCard();
        } else {
            showSuccess('Hai completato tutte le carte per oggi! 🎉');
            stopStudyMode();
        }
        
        // Aggiorna statistiche
        updateStudyStats();
        
    } catch (error) {
        showError(handleSupabaseError(error));
    }
}

// Analytics Dashboard
function showAnalyticsDashboard() {
    if (!appState.user) {
        showError('Devi effettuare l\'accesso per visualizzare gli analytics.');
        return;
    }
    
    elements.analyticsSection.classList.remove('hidden');
    elements.analyticsSection.scrollIntoView({ behavior: 'smooth' });
    loadAnalytics();
}

async function loadAnalytics() {
    if (!appState.user) return;
    
    try {
        showLoading(true, 'Caricamento analytics...');
        
        const daysBack = parseInt(elements.analyticsTimeframe.value);
        const { data, error } = await AnalyticsManager.getUserAnalytics(daysBack);
        
        if (error) {
            console.warn('Analytics non disponibili, mostrando dati di base:', error);
            // Mostra dati di base se analytics non sono disponibili
            showBasicAnalytics();
            return;
        }
        
        if (data) {
            updateAnalyticsDisplay(data);
            generateInsights(data);
        }
        
    } catch (error) {
        console.error('Errore analytics:', error);
        showBasicAnalytics();
    } finally {
        showLoading(false);
    }
}

function showBasicAnalytics() {
    // Mostra analytics di base quando il database non è ancora configurato
    elements.totalSets.textContent = '0';
    elements.totalCards.textContent = '0';
    elements.studyStreak.textContent = '0';
    elements.accuracyRate.textContent = '0%';
    elements.totalStudyTime.textContent = '0h';
    elements.cardsDueToday.textContent = '0';
    
    elements.weeklyProgressChart.innerHTML = '<div class="no-data">Database non configurato</div>';
    elements.accuracyChart.innerHTML = '<div class="no-data">Database non configurato</div>';
    
    elements.insightsList.innerHTML = `
        <div class="insight-item">
            <div class="insight-icon">⚠️</div>
            <div class="insight-content">
                <div class="insight-title">Database non configurato</div>
                <div class="insight-description">Esegui lo schema SQL nel dashboard Supabase per abilitare gli analytics completi.</div>
            </div>
        </div>
    `;
}

function updateAnalyticsDisplay(analytics) {
    // Aggiorna statistiche principali
    elements.totalSets.textContent = analytics.total_sets || 0;
    elements.totalCards.textContent = analytics.total_cards || 0;
    elements.studyStreak.textContent = analytics.study_streak || 0;
    elements.accuracyRate.textContent = `${analytics.accuracy_rate || 0}%`;
    elements.totalStudyTime.textContent = `${Math.round((analytics.total_study_time || 0) / 60)}h`;
    elements.cardsDueToday.textContent = analytics.cards_due_today || 0;
    
    // Aggiorna grafici
    updateWeeklyProgressChart(analytics.weekly_progress || []);
    updateAccuracyChart(analytics.weekly_progress || []);
}

function updateWeeklyProgressChart(weeklyData) {
    const chart = elements.weeklyProgressChart;
    
    if (!weeklyData || weeklyData.length === 0) {
        chart.innerHTML = '<div class="no-data">Nessun dato disponibile</div>';
        return;
    }
    
    // Crea un grafico semplice con CSS
    const maxCards = Math.max(...weeklyData.map(d => d.cards_studied || 0));
    
    chart.innerHTML = `
        <div class="simple-chart">
            ${weeklyData.map(day => `
                <div class="chart-bar">
                    <div class="bar" style="height: ${((day.cards_studied || 0) / maxCards) * 100}%"></div>
                    <div class="bar-label">${new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateAccuracyChart(weeklyData) {
    const chart = elements.accuracyChart;
    
    if (!weeklyData || weeklyData.length === 0) {
        chart.innerHTML = '<div class="no-data">Nessun dato disponibile</div>';
        return;
    }
    
    // Crea un grafico di accuratezza
    chart.innerHTML = `
        <div class="accuracy-chart">
            ${weeklyData.map(day => `
                <div class="accuracy-day">
                    <div class="accuracy-bar">
                        <div class="accuracy-fill" style="width: ${day.accuracy || 0}%"></div>
                    </div>
                    <div class="accuracy-label">${day.accuracy || 0}%</div>
                </div>
            `).join('')}
        </div>
    `;
}

function generateInsights(analytics) {
    const insights = AnalyticsManager.generateInsights(analytics);
    
    if (insights.length === 0) {
        elements.insightsList.innerHTML = `
            <div class="insight-item">
                <div class="insight-icon">🎯</div>
                <div class="insight-content">
                    <div class="insight-title">Inizia a studiare!</div>
                    <div class="insight-description">Crea le tue prime flashcard e inizia il tuo percorso di apprendimento.</div>
                </div>
            </div>
        `;
        return;
    }
    
    elements.insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
            </div>
        </div>
    `).join('');
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

// Mostra loading con progresso
function showLoading(show, message = 'Elaborazione in corso...') {
    appState.isLoading = show;
    const btnText = elements.generateBtn.querySelector('.btn-text');
    const spinner = elements.generateBtn.querySelector('.loading-spinner');
    
    if (show) {
        btnText.textContent = message;
        btnText.classList.remove('hidden');
        spinner.classList.remove('hidden');
        elements.generateBtn.disabled = true;
        
        // Mostra progress indicator
        showProgressIndicator(message);
    } else {
        btnText.textContent = 'Genera Flashcard';
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        elements.generateBtn.disabled = false;
        
        // Nascondi progress indicator
        hideProgressIndicator();
    }
}

// Progress indicator avanzato
function showProgressIndicator(message) {
    // Rimuovi indicatori esistenti
    hideProgressIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'progress-indicator';
    indicator.className = 'progress-indicator';
    indicator.innerHTML = `
        <div class="progress-content">
            <div class="progress-spinner"></div>
            <div class="progress-text">${message}</div>
            <div class="progress-steps">
                <div class="step active" data-step="1">Analisi testo</div>
                <div class="step" data-step="2">Generazione AI</div>
                <div class="step" data-step="3">Validazione</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(indicator);
    
    // Anima i passaggi
    setTimeout(() => updateProgressStep(2), 1000);
    setTimeout(() => updateProgressStep(3), 2000);
}

function updateProgressStep(step) {
    const steps = document.querySelectorAll('.progress-steps .step');
    steps.forEach((s, index) => {
        if (index + 1 <= step) {
            s.classList.add('active');
        }
    });
}

function hideProgressIndicator() {
    const indicator = document.getElementById('progress-indicator');
    if (indicator) {
        indicator.remove();
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

// Modal per selezione set di studio
function showSetSelectionModal(sets) {
    return new Promise((resolve) => {
        // Crea il modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;
        modal.innerHTML = `
            <div class="modal-content" style="
                background: var(--card-bg); border-radius: 12px; padding: 24px;
                max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: var(--text-color);">Seleziona Set di Studio</h3>
                    <button class="modal-close" style="
                        background: none; border: none; font-size: 24px; cursor: pointer;
                        color: var(--text-color); padding: 0; width: 30px; height: 30px;
                    ">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-color); margin-bottom: 16px;">Scegli quale set di flashcard vuoi studiare:</p>
                    <div class="set-selection-list">
                        ${sets.map(set => `
                            <div class="set-option" style="
                                border: 1px solid var(--border-color); border-radius: 8px;
                                padding: 16px; margin-bottom: 12px; display: flex;
                                justify-content: space-between; align-items: center;
                                hover: background-color: var(--hover-bg);
                            ">
                                <div class="set-info">
                                    <h4 style="margin: 0 0 4px 0; color: var(--text-color);">${set.name}</h4>
                                    <p style="margin: 0 0 8px 0; color: var(--text-secondary); font-size: 14px;">${set.description || 'Nessuna descrizione'}</p>
                                    <span style="font-size: 12px; color: var(--text-secondary);">${set.total_cards || 0} carte • ${set.subject || 'Generale'}</span>
                                </div>
                                <button class="select-set-btn" data-set-id="${set.id}" style="
                                    background: var(--primary-color); color: white; border: none;
                                    padding: 8px 16px; border-radius: 6px; cursor: pointer;
                                    font-size: 14px; font-weight: 500;
                                ">
                                    Seleziona
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(null);
            }
        };
        
        modal.querySelectorAll('.select-set-btn').forEach(btn => {
            btn.onclick = () => {
                const setId = btn.dataset.setId;
                const selectedSet = sets.find(set => set.id === setId);
                document.body.removeChild(modal);
                resolve(selectedSet);
            };
        });
    });
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

// Listener per cambiamenti di autenticazione
AuthManager.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        appState.user = session.user;
        showUserInfo();
        loadSavedFlashcards();
        updateStudyStats();
    } else if (event === 'SIGNED_OUT') {
        appState.user = null;
        showLoginForm();
    }
});

// Esponi funzioni globalmente per compatibilità
window.loadSavedSet = loadSavedSet;
window.deleteSavedSet = deleteSavedSet;
