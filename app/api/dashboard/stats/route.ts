import { NextResponse } from 'next/server'
import { connectMongo } from '../../../../lib/db'
import { getCurrentUserServer } from '../../../../lib/auth'
import CallModel from '../../../../models/Call'

export async function GET() {
  const user = await getCurrentUserServer()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const byStatus = await CallModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  const byCategory = await CallModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
  const overdueDays = 7
  const overdueThreshold = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000)
  const overdue = await CallModel.find({ status: { $in: ['new', 'in-progress'] }, callTime: { $lt: overdueThreshold } })
    .sort({ callTime: -1 })
    .limit(10)
    .lean()
  return NextResponse.json({ callsToday, callsWeek, callsMonth, byStatus, byCategory, overdue })
}
