import OpenAI from 'openai'
import { VertexAI } from '@google-cloud/vertexai'

const provider = process.env.AI_PROVIDER
const apiKey = process.env.AI_API_KEY
const gcpProjectId = process.env.GCLOUD_PROJECT_ID
const gcpLocation = process.env.GCLOUD_LOCATION || 'us-central1'

type SummaryResult = {
  summary: string
  category: string
  suggestion: string
}

export async function summarizeTranscript(transcript: string): Promise<SummaryResult> {
  if (!provider || !apiKey) {
    const summary = transcript.slice(0, 200)
    return { summary, category: 'uncategorized', suggestion: 'review and follow up' }
  }
  if (provider === 'openai') {
    const client = new OpenAI({ apiKey })
    const prompt = [
      'You are an assistant for an Indian MLA constituency office.',
      'Given a phone call transcript, produce:',
      '1) a concise 2–3 line summary,',
      '2) a main category such as infrastructure, welfare scheme, personal grievance, medical emergency, law and order, civic administration, other,',
      '3) one suggested next action for staff.',
      'Return JSON with keys summary, category, suggestion only.',
      'Transcript:',
      transcript
    ].join('\n')
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
    const content = res.choices[0]?.message?.content || ''
    const parsed = JSON.parse(content)
    return { summary: parsed.summary, category: parsed.category, suggestion: parsed.suggestion }
  }
  if (provider === 'vertex') {
    if (!gcpProjectId) {
      const summary = transcript.slice(0, 200)
      return { summary, category: 'uncategorized', suggestion: 'review and follow up' }
    }
    const vertex = new VertexAI({ project: gcpProjectId, location: gcpLocation })
    const model = vertex.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = [
      'You are an assistant for an Indian MLA constituency office.',
      'Given a phone call transcript, produce:',
      '1) a concise 2–3 line summary,',
      '2) a main category such as infrastructure, welfare scheme, personal grievance, medical emergency, law and order, civic administration, other,',
      '3) one suggested next action for staff.',
      'Return JSON with keys summary, category, suggestion only.',
      'Transcript:',
      transcript
    ].join('\n')
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
    const text =
      (response as any)?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      String((response as any)?.response?.text || '')
    const parsed = JSON.parse(text)
    return { summary: parsed.summary, category: parsed.category, suggestion: parsed.suggestion }
  }
  const summary = transcript.slice(0, 200)
  return { summary, category: 'uncategorized', suggestion: 'review and follow up' }
}
