import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../lib/db'
import { getCurrentUserServer, hashPassword } from '../../../lib/auth'
import UserModel from '../../../models/User'

export async function GET() {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectMongo()
  const users = await UserModel.find().lean()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name || '')
  const email = String(body.email || '')
  const password = String(body.password || '')
  const role = String(body.role || 'staff') as 'admin' | 'staff'
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await connectMongo()
  const passwordHash = await hashPassword(password)
  const created = await UserModel.create({ name, email, passwordHash, role })
  return NextResponse.json({ id: created._id.toString() })
}
