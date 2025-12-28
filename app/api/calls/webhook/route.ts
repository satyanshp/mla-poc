import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../../lib/db'
import CallModel from '../../../../models/Call'
import SettingModel from '../../../../models/Setting'
import { summarizeTranscript } from '../../../../lib/ai'

export async function POST(req: NextRequest) {
  const data = await req.json()
  const callerName = String(data.callerName || '')
  const phoneNumber = String(data.phoneNumber || '')
  const callTime = new Date(String(data.callTime || new Date().toISOString()))
  const duration = Number(data.duration || 0)
  const transcript = String(data.transcript || '')
  const recordingUrl = String(data.recordingUrl || '')
  if (!callerName || !phoneNumber) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  await connectMongo()
  const settings = (await SettingModel.findOne().lean()) as any
  let priority: 'low' | 'medium' | 'high' = 'medium'
  let status: 'new' | 'in-progress' | 'resolved' = 'new'
  const summaryData = transcript ? await summarizeTranscript(transcript) : { summary: '', category: '', suggestion: '' }
  if (settings?.escalationRules?.length && summaryData.category) {
    const matched = settings.escalationRules.find((r: any) => r.ifCategory.toLowerCase() === summaryData.category.toLowerCase())
    if (matched) priority = matched.setPriority
  }
  const call = await CallModel.create({
    callerName,
    phoneNumber,
    callTime,
    duration,
    transcript,
    recordingUrl,
    status,
    priority,
    summary: summaryData.summary,
    category: summaryData.category,
    suggestion: summaryData.suggestion,
    tags: []
  })
  return NextResponse.json({ id: call._id.toString() })
}
