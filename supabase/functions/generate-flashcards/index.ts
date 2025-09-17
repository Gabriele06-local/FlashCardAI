import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlashcardRequest {
  text: string;
  difficulty?: 'facile' | 'medio' | 'difficile';
  subject?: string;
  cardCount?: number;
}

// Funzione di parsing manuale per casi difficili
function parseFlashcardsManually(text: string): any[] {
  const flashcards = []
  const lines = text.split('\n').filter(line => line.trim())
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim()
    if (line.toLowerCase().includes('domanda') || line.includes('?')) {
      const nextLine = lines[i + 1]?.trim()
      if (nextLine && (nextLine.toLowerCase().includes('risposta') || nextLine.length > 10)) {
        flashcards.push({
          domanda: line.replace(/^(domanda|q):\s*/i, ''),
          risposta: nextLine.replace(/^(risposta|a):\s*/i, ''),
          difficulty: 2,
          type: 'spiegazione'
        })
      }
    }
  }
  
  return flashcards
}

// Funzione di fallback per generare flashcard di base
function generateFallbackFlashcards(text: string, count: number): any[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const flashcards = []
  
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i].trim()
    if (sentence.length > 10) {
      flashcards.push({
        domanda: `Spiega: ${sentence.substring(0, 100)}...`,
        risposta: sentence,
        difficulty: 2,
        type: 'spiegazione'
      })
    }
  }
  
  return flashcards
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica variabili d'ambiente essenziali
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurazione Supabase mancante')
    }
    
    if (!geminiKey) {
      throw new Error('API Key Gemini non configurata')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verifica autenticazione
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token di autenticazione mancante')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user.user) {
      console.error('Auth error:', authError)
      throw new Error('Autenticazione fallita')
    }

    // Check rate limiting (max 50 richieste/giorno per utente gratuito)
    const today = new Date().toISOString().split('T')[0]
    const { data: usage, error: usageError } = await supabase
      .from('api_usage')
      .select('tokens_used')
      .eq('user_id', user.user.id)
      .eq('request_date', today)
      .single()

    const dailyLimit = 50 // Aumentabile per utenti premium
    if (usage && usage.tokens_used >= dailyLimit) {
      throw new Error('Limite giornaliero raggiunto. Upgrade a Premium per più utilizzi.')
    }

    const { text, difficulty = 'medio', subject, cardCount = 10 }: FlashcardRequest = await req.json()

    if (!text || text.length < 100) {
      throw new Error('Il testo deve contenere almeno 100 caratteri')
    }

    // Prompt intelligente basato su difficoltà
    const difficultyPrompts = {
      facile: 'Crea domande semplici e dirette, ideali per ripasso rapido',
      medio: 'Crea domande di comprensione che richiedono spiegazione',
      difficile: 'Crea domande analitiche e di sintesi che richiedono pensiero critico'
    }

    const prompt = `Sei un esperto tutor universitario. Analizza questo testo e genera ESATTAMENTE ${cardCount} flashcard per aiutare lo studente a memorizzare e comprendere i concetti chiave.

ISTRUZIONI SPECIFICHE:
- Livello di difficoltà: ${difficulty} - ${difficultyPrompts[difficulty]}
- ${subject ? `Materia: ${subject}` : ''}
- Varia i tipi di domande: definizioni, spiegazioni, esempi, collegamenti
- Le domande devono essere chiare e specifiche
- Le risposte devono essere complete ma concise (max 150 parole)

FORMATO OUTPUT (SOLO JSON, nient'altro):
[
  {
    "domanda": "Domanda specifica e chiara",
    "risposta": "Risposta completa e accurata",
    "difficulty": 1-5,
    "type": "definizione|spiegazione|esempio|collegamento"
  }
]

TESTO DA ANALIZZARE:
${text.slice(0, 4000)}`

    // Chiamata a Gemini
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      let errorMessage = 'Servizio AI temporaneamente non disponibile'
      try {
        const error = await geminiResponse.json()
        errorMessage = error.error?.message || errorMessage
      } catch (e) {
        console.error('Errore nel parsing della risposta di errore:', e)
      }
      throw new Error(`Errore AI: ${errorMessage}`)
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      throw new Error('Risposta AI non valida')
    }
    
    const generatedText = geminiData.candidates[0].content.parts[0].text

    // Parsing robusto del JSON con fallback multipli
    let flashcards = []
    
    try {
      // Tentativo 1: Estrai JSON completo
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0])
      } else {
        // Tentativo 2: Cerca pattern alternativi
        const alternativePatterns = [
          /```json\s*(\[[\s\S]*?\])\s*```/,
          /```\s*(\[[\s\S]*?\])\s*```/,
          /(\{[^{}]*"domanda"[^{}]*\})/g
        ]
        
        for (const pattern of alternativePatterns) {
          const match = generatedText.match(pattern)
          if (match) {
            try {
              flashcards = JSON.parse(match[1] || match[0])
              break
            } catch (e) {
              continue
            }
          }
        }
      }
      
      // Se ancora non funziona, prova parsing manuale
      if (!flashcards || flashcards.length === 0) {
        flashcards = parseFlashcardsManually(generatedText)
      }
      
      // Validazione e pulizia robusta
      flashcards = flashcards
        .filter(card => card && typeof card === 'object')
        .filter(card => card.domanda && card.risposta && 
                        card.domanda.trim().length > 5 && 
                        card.risposta.trim().length > 5)
        .map(card => ({
          domanda: card.domanda.trim().replace(/^["']|["']$/g, ''),
          risposta: card.risposta.trim().replace(/^["']|["']$/g, ''),
          difficulty: Math.max(1, Math.min(5, parseInt(card.difficulty) || 2)),
          type: card.type || 'spiegazione'
        }))
        .slice(0, cardCount)

      if (flashcards.length === 0) {
        throw new Error('Nessuna flashcard valida generata. Il testo potrebbe essere troppo breve o non adatto.')
      }

    } catch (parseError) {
      console.error('Parsing error:', parseError)
      // Fallback: genera flashcard di base
      flashcards = generateFallbackFlashcards(text, cardCount)
    }

    // Aggiorna usage counter
    await supabase
      .from('api_usage')
      .upsert({
        user_id: user.user.id,
        request_date: today,
        tokens_used: (usage?.tokens_used || 0) + 1
      })

    return new Response(
      JSON.stringify({ 
        flashcards,
        generated_count: flashcards.length,
        remaining_calls: dailyLimit - (usage?.tokens_used || 0) - 1
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: "Servizio AI temporaneamente non disponibile. Prova più tardi." 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
