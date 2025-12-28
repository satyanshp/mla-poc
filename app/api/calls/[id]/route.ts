import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../../lib/db'
import { getCurrentUserServer } from '../../../../lib/auth'
import CallModel from '../../../../models/Call'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectMongo()
  const { id } = await params
  const call = await CallModel.findById(id).lean()
  if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ call })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  await connectMongo()
  const { id } = await params
  await CallModel.findByIdAndUpdate(id, body)
  return NextResponse.json({ ok: true })
}
