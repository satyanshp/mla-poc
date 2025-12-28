import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../../lib/db'
import UserModel from '../../../../models/User'
import { hashPassword } from '../../../../lib/auth'

const tokenEnv = process.env.SEED_ADMIN_TOKEN

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-seed-token') || req.nextUrl.searchParams.get('token') || ''
  if (!tokenEnv || token !== tokenEnv) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name || '')
  const email = String(body.email || '')
  const password = String(body.password || '')
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await connectMongo()
  const exists = await UserModel.findOne({ email })
  if (exists) return NextResponse.json({ error: 'Already exists' }, { status: 409 })
  const passwordHash = await hashPassword(password)
  const created = await UserModel.create({ name, email, passwordHash, role: 'admin' })
  return NextResponse.json({ id: created._id.toString() })
}
