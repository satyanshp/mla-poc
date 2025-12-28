import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../../lib/db'
import CallModel from '../../../../models/Call'
import { summarizeTranscript } from '../../../../lib/ai'
import { getCurrentUserServer } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const transcript = String(body.transcript || '')
  const callId = String(body.callId || '')
  if (!transcript && !callId) return NextResponse.json({ error: 'Provide transcript or callId' }, { status: 400 })
  await connectMongo()
  let text = transcript
  if (callId && !text) {
    const call = (await CallModel.findById(callId).lean()) as any
    if (!call?.transcript) return NextResponse.json({ error: 'Call transcript not found' }, { status: 404 })
    text = call.transcript
  }
  const result = await summarizeTranscript(text)
  if (callId) {
    await CallModel.findByIdAndUpdate(callId, { summary: result.summary, category: result.category, suggestion: result.suggestion })
  }
  return NextResponse.json({ ...result })
}
