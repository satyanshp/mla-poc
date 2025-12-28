'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type StatResponse = {
  byStatus: { _id: string; count: number }[]
  byCategory: { _id: string; count: number }[]
}

const colors = ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#6b7280', '#22c55e', '#3b82f6', '#8b5cf6']

export default function Charts() {
  const [stats, setStats] = useState<StatResponse | null>(null)
  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  if (!stats) return null
  const statusData = stats.byStatus.map(s => ({ name: s._id || 'unknown', count: s.count }))
  const catData = stats.byCategory.map(s => ({ name: s._id || 'uncategorized', value: s.count }))

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded border bg-white p-4">
        <div className="mb-2 font-medium">Status Chart</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded border bg-white p-4">
        <div className="mb-2 font-medium">Category Chart</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {catData.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
