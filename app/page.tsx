import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '../lib/auth'

export default async function Home() {
  const user = await getCurrentUserServer()
  if (user) redirect('/dashboard')
  redirect('/login')
}
