import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../lib/db'
import { getCurrentUserServer } from '../../../lib/auth'
import SettingModel from '../../../models/Setting'

export async function GET() {
  await connectMongo()
  const s = await SettingModel.findOne().lean()
  return NextResponse.json({ settings: s || null })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  await connectMongo()
  await SettingModel.findOneAndUpdate({}, body, { upsert: true })
  return NextResponse.json({ ok: true })
}
