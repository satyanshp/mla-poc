import { notFound } from 'next/navigation'
import { connectMongo } from '../../../lib/db'
import { getCurrentUserServer } from '../../../lib/auth'
import CallModel from '../../../models/Call'
import UserModel from '../../../models/User'

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUserServer()
  if (!user) return (
    <div>
      <meta httpEquiv="refresh" content="0; url=/login" />
    </div>
  )
  await connectMongo()
  const call = (await CallModel.findById(params.id).lean()) as any
  if (!call) notFound()
  const users = (await UserModel.find().lean()) as any[]

  async function update(formData: FormData) {
    'use server'
    const status = String(formData.get('status') || call.status)
    const priority = String(formData.get('priority') || call.priority)
    const assignedTo = String(formData.get('assignedTo') || call.assignedTo || '')
    const tags = String(formData.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)
    await connectMongo()
    await CallModel.findByIdAndUpdate(call._id, { status, priority, assignedTo: assignedTo || null, tags })
  }

  async function addNote(formData: FormData) {
    'use server'
    const text = String(formData.get('text') || '')
    if (!text) return
    await connectMongo()
    await CallModel.findByIdAndUpdate(call._id, { $push: { notes: { userId: (user!._id as any), text, createdAt: new Date() } } })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Call Detail</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded border bg-white p-4">
            <div className="mb-2 text-sm text-gray-600">Caller</div>
            <div className="font-medium">{call.callerName} • {call.phoneNumber}</div>
            <div className="text-sm">{new Date(call.callTime).toLocaleString()} • {call.duration}s</div>
          </div>
          {call.recordingUrl && (
            <div className="rounded border bg-white p-4">
              <div className="mb-2 font-medium">Recording</div>
              <audio controls src={call.recordingUrl} className="w-full" />
            </div>
          )}
          {call.transcript && (
            <div className="rounded border bg-white p-4">
              <div className="mb-2 font-medium">Transcript</div>
              <pre className="whitespace-pre-wrap text-sm">{call.transcript}</pre>
            </div>
          )}
          {(call.summary || call.category || call.suggestion) && (
            <div className="rounded border bg-white p-4">
              <div className="mb-2 font-medium">AI Summary</div>
              <div className="text-sm">Category: {call.category || 'uncategorized'}</div>
              {call.summary && <p className="mt-2 text-sm">{call.summary}</p>}
              {call.suggestion && <p className="mt-2 text-sm">Next: {call.suggestion}</p>}
            </div>
          )}
          <div className="rounded border bg-white p-4">
            <div className="mb-2 font-medium">Notes</div>
            <ul className="space-y-2">
              {(call.notes || []).map((n: any) => (
                <li key={n._id} className="rounded border p-2 text-sm">
                  <div>{n.text}</div>
                  <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
            <form action={addNote} className="mt-3 flex gap-2">
              <input name="text" className="flex-1 rounded border px-3 py-2" placeholder="Add note" />
              <button className="rounded bg-blue-600 px-4 py-2 text-white">Add</button>
            </form>
          </div>
        </div>
        <div className="space-y-4">
          <form action={update} className="rounded border bg-white p-4 space-y-3">
            <div>
              <label className="block text-sm">Status</label>
              <select name="status" defaultValue={call.status} className="mt-1 w-full rounded border px-3 py-2">
                <option value="new">new</option>
                <option value="in-progress">in-progress</option>
                <option value="resolved">resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Priority</label>
              <select name="priority" defaultValue={call.priority} className="mt-1 w-full rounded border px-3 py-2">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Assign To</label>
              <select name="assignedTo" defaultValue={call.assignedTo?.toString() || ''} className="mt-1 w-full rounded border px-3 py-2">
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id.toString()} value={u._id.toString()}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Tags</label>
              <input name="tags" defaultValue={(call.tags || []).join(', ')} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <button className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
          </form>
        </div>
      </div>
    </div>
  )
}
