import { connectMongo } from '../../lib/db'
import { getCurrentUserServer } from '../../lib/auth'
import SettingModel from '../../models/Setting'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const user = await getCurrentUserServer()
  if (!user) return (
    <div>
      <meta httpEquiv="refresh" content="0; url=/login" />
    </div>
  )
  if (user.role !== 'admin') redirect('/dashboard')
  await connectMongo()
  const existing = (await SettingModel.findOne().lean()) as any

  async function save(formData: FormData) {
    'use server'
    const welcomeMessage = String(formData.get('welcomeMessage') || '')
    const faqsRaw = String(formData.get('faqs') || '')
    const rulesRaw = String(formData.get('rules') || '')
    const faqs = faqsRaw
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [question, answer] = l.split('=>')
        return { question: question?.trim() || '', answer: answer?.trim() || '' }
      })
      .filter(f => f.question && f.answer)
    const escalationRules = rulesRaw
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [cat, pr] = l.split('=>')
        const setPriority = (pr?.trim() || 'high') as 'low' | 'medium' | 'high'
        return { ifCategory: cat?.trim() || '', setPriority }
      })
      .filter(r => r.ifCategory)
    await connectMongo()
    await SettingModel.findOneAndUpdate({}, { welcomeMessage, faqs, escalationRules }, { upsert: true })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bot Configuration</h1>
      <form action={save} className="space-y-4 rounded border bg-white p-4">
        <div>
          <label className="block text-sm">Welcome Message</label>
          <textarea name="welcomeMessage" className="mt-1 w-full rounded border p-2" rows={3} defaultValue={existing?.welcomeMessage || ''} />
        </div>
        <div>
          <label className="block text-sm">FAQ (one per line: question =&gt; answer)</label>
          <textarea name="faqs" className="mt-1 w-full rounded border p-2" rows={6} defaultValue={(existing?.faqs || []).map((f: any) => `${f.question} => ${f.answer}`).join('\n')} />
        </div>
        <div>
          <label className="block text-sm">Escalation Rules (one per line: category =&gt; priority)</label>
          <textarea name="rules" className="mt-1 w-full rounded border p-2" rows={6} defaultValue={(existing?.escalationRules || []).map((r: any) => `${r.ifCategory} => ${r.setPriority}`).join('\n')} />
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
      </form>
    </div>
  )
}
