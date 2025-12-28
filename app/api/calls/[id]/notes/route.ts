import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../../../lib/db'
import { getCurrentUserServer } from '../../../../../lib/auth'
import CallModel from '../../../../../models/Call'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const text = String(body.text || '')
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  await connectMongo()
  const { id } = await params
  await CallModel.findByIdAndUpdate(id, { $push: { notes: { userId: user._id, text, createdAt: new Date() } } })
  return NextResponse.json({ ok: true })
}
