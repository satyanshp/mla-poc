import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getCurrentUserServer } from '../lib/auth'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserServer()
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-10 border-b bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-semibold">MLA Dashboard</Link>
              <nav className="flex items-center gap-4">
                {user ? (
                  <>
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/calls">Calls</Link>
                    {user.role === 'admin' && <Link href="/staff">Staff</Link>}
                    {user.role === 'admin' && <Link href="/settings">Settings</Link>}
                    <form action="/api/auth/logout" method="post">
                      <button className="rounded bg-gray-100 px-3 py-1">Logout</button>
                    </form>
                  </>
                ) : (
                  <Link href="/login">Login</Link>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
