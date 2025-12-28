import { connectMongo } from '../../lib/db'
import { getCurrentUserServer } from '../../lib/auth'
import CallModel from '../../models/Call'
import Charts from '../../components/Charts'
import { redirect } from 'next/navigation'

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUserServer()
  if (!user) redirect('/login')
  await connectMongo()
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const callsToday = await CallModel.countDocuments({ callTime: { $gte: startOfDay } })
  const callsWeek = await CallModel.countDocuments({ callTime: { $gte: startOfWeek } })
  const callsMonth = await CallModel.countDocuments({ callTime: { $gte: startOfMonth } })
  const byStatusAgg = await CallModel.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ])
  const byCategoryAgg = await CallModel.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ])
  const overdueDays = 7
  const overdueThreshold = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000)
  const overdue = await CallModel.find({ status: { $in: ['new', 'in-progress'] }, callTime: { $lt: overdueThreshold } })
    .sort({ callTime: -1 })
    .limit(10)
    .lean()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Calls Today" value={callsToday} />
        <StatCard title="Calls This Week" value={callsWeek} />
        <StatCard title="Calls This Month" value={callsMonth} />
      </div>
      <Charts />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <div className="mb-2 font-medium">By Status</div>
          <ul>
            {byStatusAgg.map(s => (
              <li key={s._id} className="flex justify-between py-1">
                <span>{s._id || 'unknown'}</span>
                <span>{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="mb-2 font-medium">By Category</div>
          <ul>
            {byCategoryAgg.map(s => (
              <li key={s._id || 'uncategorized'} className="flex justify-between py-1">
                <span>{s._id || 'uncategorized'}</span>
                <span>{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded border bg-white p-4">
        <div className="mb-2 font-medium">Overdue Calls</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Caller</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {overdue.map(c => (
              <tr key={String(c._id)}>
                <td className="p-2">{c.callerName}</td>
                <td className="p-2">{c.phoneNumber}</td>
                <td className="p-2">{new Date(c.callTime).toLocaleDateString()}</td>
                <td className="p-2">{c.status}</td>
                <td className="p-2">{c.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
