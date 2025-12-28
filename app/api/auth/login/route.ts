import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '../../../../lib/db'
import UserModel from '../../../../models/User'
import { signToken, verifyPassword, COOKIE_NAME } from '../../../../lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = String(body.email || '')
  const password = String(body.password || '')
  if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  await connectMongo()
  const user = await UserModel.findOne({ email })
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const token = signToken({ id: user._id.toString(), role: user.role })
  const res = NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role })
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  })
  return res
}
