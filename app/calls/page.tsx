import Link from 'next/link'
import { connectMongo } from '../../lib/db'
import { getCurrentUserServer } from '../../lib/auth'
import CallModel from '../../models/Call'

type SearchParams = {
  page?: string
  pageSize?: string
  status?: string
  priority?: string
  q?: string
  startDate?: string
  endDate?: string
  tags?: string
}

export default async function CallsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUserServer()
  if (!user) return (
    <div>
      <meta httpEquiv="refresh" content="0; url=/login" />
    </div>
  )
  await connectMongo()
  const page = Number(searchParams.page || 1)
  const pageSize = Math.min(Number(searchParams.pageSize || 20), 100)
  const filter: any = {}
  if (searchParams.status) filter.status = searchParams.status
  if (searchParams.priority) filter.priority = searchParams.priority
  if (searchParams.q) filter.$or = [
    { callerName: { $regex: searchParams.q, $options: 'i' } },
    { phoneNumber: { $regex: searchParams.q, $options: 'i' } },
    { transcript: { $regex: searchParams.q, $options: 'i' } },
    { summary: { $regex: searchParams.q, $options: 'i' } }
  ]
  if (searchParams.startDate || searchParams.endDate) {
    filter.callTime = {}
    if (searchParams.startDate) filter.callTime.$gte = new Date(searchParams.startDate)
    if (searchParams.endDate) filter.callTime.$lte = new Date(searchParams.endDate)
  }
  if (searchParams.tags) {
    const tags = searchParams.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.length) filter.tags = { $all: tags }
  }
  const total = await CallModel.countDocuments(filter)
  const calls = await CallModel.find(filter)
    .sort({ callTime: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calls</h1>
      <div className="rounded border bg-white p-4">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <input name="q" placeholder="Search" className="rounded border px-3 py-2 md:col-span-2" defaultValue={searchParams.q || ''} />
          <select name="status" className="rounded border px-3 py-2">
            <option value="">All Status</option>
            <option value="new" selected={searchParams.status === 'new'}>new</option>
            <option value="in-progress" selected={searchParams.status === 'in-progress'}>in-progress</option>
            <option value="resolved" selected={searchParams.status === 'resolved'}>resolved</option>
          </select>
          <select name="priority" className="rounded border px-3 py-2">
            <option value="">All Priority</option>
            <option value="low" selected={searchParams.priority === 'low'}>low</option>
            <option value="medium" selected={searchParams.priority === 'medium'}>medium</option>
            <option value="high" selected={searchParams.priority === 'high'}>high</option>
          </select>
          <input type="date" name="startDate" className="rounded border px-3 py-2" defaultValue={searchParams.startDate || ''} />
          <input type="date" name="endDate" className="rounded border px-3 py-2" defaultValue={searchParams.endDate || ''} />
          <input name="tags" placeholder="tags comma separated" className="rounded border px-3 py-2 md:col-span-2" defaultValue={searchParams.tags || ''} />
          <button className="rounded bg-blue-600 px-4 py-2 text-white md:col-span-1">Filter</button>
        </form>
      </div>
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Caller</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {calls.map(c => (
              <tr key={String(c._id)} className="border-t">
                <td className="p-2">
                  <Link className="text-blue-600 underline" href={`/calls/${c._id}`}>{c.callerName}</Link>
                </td>
                <td className="p-2">{c.phoneNumber}</td>
                <td className="p-2">{new Date(c.callTime).toLocaleString()}</td>
                <td className="p-2">{c.status}</td>
                <td className="p-2">{c.priority}</td>
                <td className="p-2">{c.summary || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <div>Page {page} of {Math.ceil(total / pageSize) || 1}</div>
        <div className="flex gap-2">
          {page > 1 && <Link className="rounded border px-3 py-1" href={`/calls?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}>Prev</Link>}
          {(page * pageSize) < total && <Link className="rounded border px-3 py-1" href={`/calls?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}>Next</Link>}
        </div>
      </div>
    </div>
  )
}
