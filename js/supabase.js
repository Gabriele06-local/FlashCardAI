import { createClient } from '@supabase/supabase-js'

// Configurazione Supabase - Credenziali aggiornate
const supabaseUrl = 'https://rixnizceeggdhlridwrj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeG5pemNlZWdnZGhscmlkd3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDY5MzQsImV4cCI6MjA3MzYyMjkzNH0.3YPTcW2_cfS0NCLimGpU2xpp8T5C8LPv-bluQtDB3vQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Classe per gestire l'autenticazione
export class AuthManager {
  static async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    return { data, error }
  }

  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }

  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Classe per gestire le flashcard
export class FlashcardManager {
  static async createFlashcardSet(name, description, subject, isPublic = false) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase
      .from('flashcard_sets')
      .insert({
        user_id: user.id,
        name,
        description,
        subject,
        is_public: isPublic
      })
      .select()
      .single()

    return { data, error }
  }

  static async addFlashcards(setId, flashcards) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const flashcardsToInsert = flashcards.map((card, index) => ({
      set_id: setId,
      question: card.domanda,
      answer: card.risposta,
      difficulty: card.difficulty || 2,
      order_index: index
    }))

    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select()

    // Aggiorna il contatore delle flashcard nel set
    if (!error) {
      await supabase
        .from('flashcard_sets')
        .update({ total_cards: flashcards.length })
        .eq('id', setId)
    }

    return { data, error }
  }

  static async getUserFlashcardSets() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase
      .from('flashcard_sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  static async getFlashcardSet(setId) {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('id', setId)
      .single()

    return { data, error }
  }

  static async deleteFlashcardSet(setId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { error } = await supabase
      .from('flashcard_sets')
      .delete()
      .eq('id', setId)
      .eq('user_id', user.id)

    return { error }
  }

  static async getPublicFlashcardSets() {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    return { data, error }
  }
}

// Classe per la ripetizione spaziata avanzata (SM-2 Algorithm + Analytics)
export class SpacedRepetition {
  static async calculateNext(quality, repetitions = 0, easeFactor = 2.5, interval = 1, userStats = {}) {
    // Ottieni statistiche utente se non fornite
    if (!userStats || Object.keys(userStats).length === 0) {
      userStats = await this.getUserPerformanceStats() || {};
    }

    if (quality < 3) {
      // Risposta sbagliata - ricomincia con penalità
      const penalty = this.calculatePenalty(userStats);
      return {
        repetitions: 0,
        interval: 1,
        easeFactor: Math.max(1.3, easeFactor - 0.2 - penalty),
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000) // Domani
      }
    }

    // Calcola ease factor con personalizzazione
    const qualityFactor = this.getQualityFactor(quality);
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, Math.min(3.0, newEaseFactor));
    
    // Applica bonus per performance consistenti
    if (userStats.consistency > 0.8) {
      newEaseFactor = Math.min(3.0, newEaseFactor + 0.1);
    }
    
    // Calcola intervallo personalizzato
    let newInterval
    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      const personalizationFactor = this.getPersonalizationFactor(userStats);
      newInterval = Math.round(interval * newEaseFactor * personalizationFactor)
    }

    return {
      repetitions: repetitions + 1,
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReview: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
      difficulty: this.calculateDifficulty(quality, newEaseFactor, userStats)
    }
  }

  static calculatePenalty(userStats) {
    // Penalità basata su errori recenti
    if (userStats.recentErrors > 3) return 0.3;
    if (userStats.recentErrors > 1) return 0.1;
    return 0;
  }

  static getPersonalizationFactor(userStats) {
    // Fattore di personalizzazione basato su analytics
    const avgAccuracy = userStats.accuracy || 0.8;
    
    // Utenti con alta accuratezza possono avere intervalli più lunghi
    if (avgAccuracy > 0.9) return 1.2;
    if (avgAccuracy > 0.8) return 1.1;
    if (avgAccuracy < 0.6) return 0.8;
    
    return 1.0;
  }

  static getQualityFactor(quality) {
    // Fattore qualità per calcolo ease factor
    const factors = {
      5: 0.15,  // Perfetto
      4: 0.1,   // Facile
      3: 0.05,  // Normale
      2: -0.1,  // Difficile
      1: -0.2   // Molto difficile
    };
    return factors[quality] || 0;
  }

  static calculateDifficulty(quality, easeFactor, userStats) {
    // Calcola difficoltà dinamica basata su performance
    let difficulty = 2; // Default
    
    if (quality >= 4) {
      difficulty = Math.max(1, difficulty - 0.5);
    } else if (quality <= 2) {
      difficulty = Math.min(5, difficulty + 0.5);
    }
    
    // Aggiusta basato su ease factor
    if (easeFactor > 2.5) difficulty = Math.max(1, difficulty - 0.3);
    if (easeFactor < 1.8) difficulty = Math.min(5, difficulty + 0.3);
    
    return Math.round(difficulty * 10) / 10; // Arrotonda a 1 decimale
  }

  static async getUserPerformanceStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('study_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      // Calcola statistiche aggregate
      const totalCards = data.reduce((sum, day) => sum + day.cards_studied, 0);
      const totalCorrect = data.reduce((sum, day) => sum + day.correct_answers, 0);
      const totalIncorrect = data.reduce((sum, day) => sum + day.incorrect_answers, 0);
      
      return {
        totalCards,
        accuracy: totalCards > 0 ? totalCorrect / totalCards : 0,
        studyDays: data.length,
        avgCardsPerDay: data.length > 0 ? totalCards / data.length : 0,
        consistency: this.calculateConsistency(data),
        recentErrors: this.calculateRecentErrors(data)
      };
    } catch (error) {
      console.error('Errore nel calcolo statistiche performance:', error);
      return null;
    }
  }

  static calculateConsistency(data) {
    if (data.length < 3) return 0;
    
    const studyDays = data.filter(day => day.cards_studied > 0).length;
    const totalDays = data.length;
    
    return studyDays / totalDays;
  }

  static calculateRecentErrors(data) {
    // Conta errori negli ultimi 3 giorni
    const recentData = data.slice(0, 3);
    return recentData.reduce((sum, day) => sum + day.incorrect_answers, 0);
  }

  static async recordStudySession(cardId, quality, sessionData = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    // Ottieni la sessione di studio esistente
    const { data: existingSession } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .single()

    // Ottieni statistiche utente per personalizzazione
    const userStats = await this.getUserPerformanceStats()

    let newData
    if (existingSession) {
      newData = await this.calculateNext(
        quality,
        existingSession.repetitions,
        existingSession.ease_factor,
        existingSession.interval_days,
        userStats
      )
    } else {
      newData = await this.calculateNext(quality, 0, 2.5, 1, userStats)
    }

    // Salva o aggiorna la sessione di studio
    const sessionRecord = {
      user_id: user.id,
      card_id: cardId,
      quality,
      ease_factor: newData.easeFactor,
      interval_days: newData.interval,
      next_review_date: newData.nextReview.toISOString().split('T')[0],
      repetitions: newData.repetitions,
      studied_at: new Date().toISOString(),
      response_time: sessionData.responseTime || null,
      study_mode: sessionData.mode || 'spaced_repetition',
      device_type: sessionData.deviceType || 'desktop'
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .upsert(sessionRecord, { 
        onConflict: 'user_id,card_id',
        ignoreDuplicates: false 
      })
      .select()

    // Aggiorna analytics utente
    if (!error) {
      await this.updateUserAnalytics(user.id, quality, sessionData)
    }

    return { data, error }
  }

  static async updateUserAnalytics(userId, quality, sessionData) {
    try {
      // Aggiorna statistiche giornaliere
      const today = new Date().toISOString().split('T')[0]
      
      const { data: existing, error: fetchError } = await supabase
        .from('study_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }
      
      const updateData = {
        user_id: userId,
        date: today,
        cards_studied: (existing?.cards_studied || 0) + 1,
        correct_answers: (existing?.correct_answers || 0) + (quality >= 3 ? 1 : 0),
        incorrect_answers: (existing?.incorrect_answers || 0) + (quality < 3 ? 1 : 0),
        study_time_minutes: (existing?.study_time_minutes || 0) + (sessionData.duration || 0),
        updated_at: new Date().toISOString()
      }
      
      if (existing) {
        const { error } = await supabase
          .from('study_analytics')
          .update(updateData)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('study_analytics')
          .insert(updateData)
        
        if (error) throw error
      }
      
    } catch (error) {
      console.error('Errore nell\'aggiornamento analytics:', error)
    }
  }

  static async getCardsForReview() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        flashcards (
          *,
          flashcard_sets (*)
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })

    return { data, error }
  }
}

// Classe per gestire l'API usage
export class ApiUsageManager {
  static async checkDailyLimit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('api_usage')
      .select('tokens_used')
      .eq('user_id', user.id)
      .eq('request_date', today)
      .single()

    return { data, error }
  }

  static async incrementUsage() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('api_usage')
      .upsert({
        user_id: user.id,
        request_date: today,
        tokens_used: 1
      }, {
        onConflict: 'user_id,request_date',
        ignoreDuplicates: false
      })
      .select()

    return { data, error }
  }
}

// Funzione per chiamare l'Edge Function
export async function generateFlashcardsWithAI(text, difficulty = 'medio', subject = '', cardCount = 10) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Utente non autenticato')

  const { data, error } = await supabase.functions.invoke('generate-flashcards', {
    body: {
      text,
      difficulty,
      subject,
      cardCount
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })

  return { data, error }
}

// Classe per gestire Analytics
export class AnalyticsManager {
  static async getUserAnalytics(daysBack = 30) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase.rpc('get_user_analytics', {
      user_uuid: user.id,
      days_back: daysBack
    })

    return { data, error }
  }

  // recordStudySession rimossa - usa SpacedRepetition.recordStudySession invece

  static async updateDailyAnalytics(cardsStudied, correctAnswers, studyTimeMinutes) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('study_analytics')
      .upsert({
        user_id: user.id,
        date: today,
        cards_studied: cardsStudied,
        correct_answers: correctAnswers,
        incorrect_answers: cardsStudied - correctAnswers,
        study_time_minutes: studyTimeMinutes
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()

    return { data, error }
  }

  static async getWeeklyProgress() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase
      .from('study_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })

    return { data, error }
  }

  static async getCardsForReview() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase.rpc('get_cards_for_review', {
      user_uuid: user.id
    })

    return { data, error }
  }

  static generateInsights(analytics) {
    const insights = []

    // Insight 1: Streak
    if (analytics.study_streak > 0) {
      insights.push({
        icon: '🔥',
        title: `Streak di ${analytics.study_streak} giorni!`,
        description: analytics.study_streak >= 7 
          ? 'Fantastico! Mantieni questo ritmo per consolidare le tue conoscenze.'
          : 'Continua così! Ogni giorno di studio conta per il tuo apprendimento.'
      })
    }

    // Insight 2: Accuratezza
    if (analytics.accuracy_rate > 0) {
      if (analytics.accuracy_rate >= 80) {
        insights.push({
          icon: '🎯',
          title: 'Eccellente accuratezza!',
          description: `Con il ${analytics.accuracy_rate}% di risposte corrette, stai padroneggiando bene i contenuti.`
        })
      } else if (analytics.accuracy_rate < 60) {
        insights.push({
          icon: '📚',
          title: 'Focus sul ripasso',
          description: `La tua accuratezza è del ${analytics.accuracy_rate}%. Considera di ripassare i contenuti più difficili.`
        })
      }
    }

    // Insight 3: Tempo di studio
    if (analytics.total_study_time > 0) {
      const hours = Math.round(analytics.total_study_time / 60)
      if (hours >= 10) {
        insights.push({
          icon: '⏰',
          title: 'Studio intensivo!',
          description: `Hai studiato ${hours} ore negli ultimi 30 giorni. Ottimo impegno!`
        })
      }
    }

    // Insight 4: Carte da ripassare
    if (analytics.cards_due_today > 0) {
      insights.push({
        icon: '📅',
        title: 'Carte in attesa',
        description: `Hai ${analytics.cards_due_today} carte da ripassare oggi. Non dimenticare di studiare!`
      })
    }

    // Insight 5: Progresso generale
    if (analytics.total_cards > 0) {
      insights.push({
        icon: '📈',
        title: 'Progresso costante',
        description: `Hai creato ${analytics.total_cards} flashcard in ${analytics.total_sets} set. Continua a espandere le tue conoscenze!`
      })
    }

    return insights
  }
}

// Utility per gestire errori
export function handleSupabaseError(error) {
  console.error('Supabase Error:', error)
  
  if (error.message.includes('JWT')) {
    return 'Sessione scaduta. Effettua nuovamente l\'accesso.'
  }
  
  if (error.message.includes('permission')) {
    return 'Non hai i permessi per eseguire questa operazione.'
  }
  
  if (error.message.includes('network')) {
    return 'Errore di connessione. Verifica la tua connessione internet.'
  }
  
  return error.message || 'Si è verificato un errore imprevisto.'
}
