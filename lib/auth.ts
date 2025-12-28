import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectMongo } from './db'
import UserModel, { User } from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET as string
export const COOKIE_NAME = 'mla_session'

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { id: string; role: 'admin' | 'staff' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: 'admin' | 'staff'; iat: number; exp: number }
  } catch {
    return null
  }
}

export async function getCurrentUserServer(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  await connectMongo()
  const doc = (await UserModel.findById(decoded.id).lean()) as any
  if (!doc) return null
  return { _id: String(doc._id), name: doc.name, email: doc.email, role: doc.role }
}
