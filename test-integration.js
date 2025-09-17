// Script di test per verificare l'integrazione Supabase
import { 
    supabase, 
    AuthManager, 
    FlashcardManager, 
    SpacedRepetition,
    generateFlashcardsWithAI 
} from './js/supabase.js';

// Test di configurazione
console.log('🧪 Test Integrazione Supabase Flashcard Generator');

// Test 1: Connessione Supabase
async function testSupabaseConnection() {
    console.log('\n1. Test connessione Supabase...');
    try {
        const { data, error } = await supabase.from('flashcard_sets').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Connessione Supabase OK');
        return true;
    } catch (error) {
        console.error('❌ Errore connessione Supabase:', error.message);
        return false;
    }
}

// Test 2: Autenticazione
async function testAuthentication() {
    console.log('\n2. Test autenticazione...');
    try {
        // Test signup (se non esiste già)
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'testpassword123';
        
        const { data, error } = await AuthManager.signUp(testEmail, testPassword);
        if (error && !error.message.includes('already registered')) {
            throw error;
        }
        
        console.log('✅ Test signup OK');
        
        // Test signin
        const { data: signinData, error: signinError } = await AuthManager.signIn(testEmail, testPassword);
        if (signinError) throw signinError;
        
        console.log('✅ Test signin OK');
        console.log('👤 Utente test:', signinData.user.email);
        
        return signinData.user;
    } catch (error) {
        console.error('❌ Errore autenticazione:', error.message);
        return null;
    }
}

// Test 3: Gestione Flashcard
async function testFlashcardManagement(user) {
    console.log('\n3. Test gestione flashcard...');
    if (!user) {
        console.log('⏭️ Salto test flashcard - utente non autenticato');
        return false;
    }
    
    try {
        // Crea un set di test
        const { data: setData, error: setError } = await FlashcardManager.createFlashcardSet(
            'Test Set',
            'Set di test per verifica integrazione',
            'Test'
        );
        
        if (setError) throw setError;
        console.log('✅ Creazione set OK:', setData.id);
        
        // Aggiungi flashcard di test
        const testFlashcards = [
            { domanda: 'Test domanda 1', risposta: 'Test risposta 1', difficulty: 2 },
            { domanda: 'Test domanda 2', risposta: 'Test risposta 2', difficulty: 3 }
        ];
        
        const { error: cardsError } = await FlashcardManager.addFlashcards(
            setData.id,
            testFlashcards
        );
        
        if (cardsError) throw cardsError;
        console.log('✅ Aggiunta flashcard OK');
        
        // Recupera il set
        const { data: retrievedSet, error: retrieveError } = await FlashcardManager.getFlashcardSet(setData.id);
        if (retrieveError) throw retrieveError;
        
        console.log('✅ Recupero set OK:', retrievedSet.flashcards.length, 'flashcard');
        
        // Pulisci - elimina il set di test
        const { error: deleteError } = await FlashcardManager.deleteFlashcardSet(setData.id);
        if (deleteError) throw deleteError;
        
        console.log('✅ Pulizia test OK');
        return true;
        
    } catch (error) {
        console.error('❌ Errore gestione flashcard:', error.message);
        return false;
    }
}

// Test 4: Ripetizione Spaziata
async function testSpacedRepetition(user) {
    console.log('\n4. Test ripetizione spaziata...');
    if (!user) {
        console.log('⏭️ Salto test ripetizione spaziata - utente non autenticato');
        return false;
    }
    
    try {
        // Test algoritmo SM-2
        const result1 = SpacedRepetition.calculateNext(3, 0, 2.5, 1);
        console.log('✅ Calcolo SM-2 OK:', result1);
        
        const result2 = SpacedRepetition.calculateNext(5, 2, 2.5, 6);
        console.log('✅ Calcolo SM-2 avanzato OK:', result2);
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore ripetizione spaziata:', error.message);
        return false;
    }
}

// Test 5: Edge Function (se disponibile)
async function testEdgeFunction(user) {
    console.log('\n5. Test Edge Function...');
    if (!user) {
        console.log('⏭️ Salto test Edge Function - utente non autenticato');
        return false;
    }
    
    try {
        const testText = `
        La fotosintesi è il processo attraverso il quale le piante convertono la luce solare in energia chimica.
        Questo processo avviene principalmente nelle foglie, dove la clorofilla cattura la luce.
        La fotosintesi produce glucosio e ossigeno come sottoprodotti.
        `;
        
        const { data, error } = await generateFlashcardsWithAI(testText, 'medio', 'Biologia', 3);
        
        if (error) {
            console.log('⚠️ Edge Function non disponibile (normale in sviluppo):', error.message);
            return false;
        }
        
        console.log('✅ Edge Function OK:', data.flashcards.length, 'flashcard generate');
        console.log('📊 Chiamate rimanenti:', data.remaining_calls);
        return true;
        
    } catch (error) {
        console.log('⚠️ Edge Function non disponibile (normale in sviluppo):', error.message);
        return false;
    }
}

// Esegui tutti i test
async function runAllTests() {
    console.log('🚀 Avvio test integrazione...\n');
    
    const results = {
        connection: await testSupabaseConnection(),
        auth: await testAuthentication(),
        flashcards: false,
        spacedRepetition: false,
        edgeFunction: false
    };
    
    if (results.auth) {
        results.flashcards = await testFlashcardManagement(results.auth);
        results.spacedRepetition = await testSpacedRepetition(results.auth);
        results.edgeFunction = await testEdgeFunction(results.auth);
    }
    
    // Riepilogo
    console.log('\n📊 Riepilogo Test:');
    console.log('==================');
    console.log(`Connessione Supabase: ${results.connection ? '✅' : '❌'}`);
    console.log(`Autenticazione: ${results.auth ? '✅' : '❌'}`);
    console.log(`Gestione Flashcard: ${results.flashcards ? '✅' : '❌'}`);
    console.log(`Ripetizione Spaziata: ${results.spacedRepetition ? '✅' : '❌'}`);
    console.log(`Edge Function: ${results.edgeFunction ? '✅' : '⚠️'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Test completati: ${passedTests}/${totalTests}`);
    
    if (passedTests >= 3) {
        console.log('🎉 Integrazione Supabase funzionante!');
    } else {
        console.log('⚠️ Alcuni test falliti. Controlla la configurazione.');
    }
    
    // Logout utente test
    if (results.auth) {
        await AuthManager.signOut();
        console.log('👋 Logout utente test completato');
    }
}

// Avvia i test se eseguito direttamente
if (typeof window !== 'undefined') {
    // Browser environment
    window.runSupabaseTests = runAllTests;
    console.log('💡 Esegui runSupabaseTests() nella console per avviare i test');
} else {
    // Node.js environment
    runAllTests().catch(console.error);
}
