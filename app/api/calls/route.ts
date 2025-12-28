import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../lib/db'
import { getCurrentUserServer } from '../../../lib/auth'
import CallModel from '../../../models/Call'

export async function GET(req: NextRequest) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') || 1)
  const pageSize = Math.min(Number(searchParams.get('pageSize') || 20), 100)
  const filter: any = {}
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const q = searchParams.get('q')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const tags = searchParams.get('tags')
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (q) filter.$or = [
    { callerName: { $regex: q, $options: 'i' } },
    { phoneNumber: { $regex: q, $options: 'i' } },
    { transcript: { $regex: q, $options: 'i' } },
    { summary: { $regex: q, $options: 'i' } }
  ]
  if (startDate || endDate) {
    filter.callTime = {}
    if (startDate) filter.callTime.$gte = new Date(startDate)
    if (endDate) filter.callTime.$lte = new Date(endDate)
  }
  if (tags) {
    const arr = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (arr.length) filter.tags = { $all: arr }
  }
  await connectMongo()
  const total = await CallModel.countDocuments(filter)
  const calls = await CallModel.find(filter).sort({ callTime: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean()
  return NextResponse.json({ calls, total, page, pageSize })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const payload: any = {}
  if (body.status) payload.status = String(body.status)
  if (body.priority) payload.priority = String(body.priority)
  if (body.assignedTo) payload.assignedTo = String(body.assignedTo)
  if (Array.isArray(body.tags)) payload.tags = body.tags
  await connectMongo()
  await CallModel.findByIdAndUpdate(id, payload)
  return NextResponse.json({ ok: true })
}
