import { connectMongo } from '../../lib/db'
import { getCurrentUserServer, hashPassword } from '../../lib/auth'
import UserModel from '../../models/User'
import { redirect } from 'next/navigation'

export default async function StaffPage() {
  const user = await getCurrentUserServer()
  if (!user) return (
    <div>
      <meta httpEquiv="refresh" content="0; url=/login" />
    </div>
  )
  if (user.role !== 'admin') redirect('/dashboard')
  await connectMongo()
  const users = (await UserModel.find().lean()) as any[]

  async function create(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')
    const role = String(formData.get('role') || 'staff') as 'admin' | 'staff'
    if (!name || !email || !password) return
    await connectMongo()
    const passwordHash = await hashPassword(password)
    await UserModel.create({ name, email, passwordHash, role })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <div className="rounded border bg-white p-4">
        <form action={create} className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <input name="name" placeholder="Name" className="rounded border px-3 py-2" />
          <input name="email" placeholder="Email" className="rounded border px-3 py-2" />
          <input name="password" placeholder="Password" type="password" className="rounded border px-3 py-2" />
          <select name="role" className="rounded border px-3 py-2">
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
          <button className="rounded bg-blue-600 px-4 py-2 text-white">Add</button>
        </form>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={String(u._id)} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
