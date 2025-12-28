import mongoose, { Schema, model, models } from 'mongoose'

export type CallNote = {
  _id?: string
  userId: mongoose.Types.ObjectId
  text: string
  createdAt: Date
}

export type Call = {
  _id: string
  callerName: string
  phoneNumber: string
  callTime: Date
  duration: number
  transcript?: string
  recordingUrl?: string
  status: 'new' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  tags: string[]
  summary?: string
  category?: string
  suggestion?: string
  notes?: CallNote[]
  createdAt: Date
  updatedAt: Date
}

type CallDoc = mongoose.Document & {
  callerName: string
  phoneNumber: string
  callTime: Date
  duration: number
  transcript?: string
  recordingUrl?: string
  status: 'new' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  assignedTo?: mongoose.Types.ObjectId
  tags: string[]
  summary?: string
  category?: string
  suggestion?: string
  notes: {
    userId: mongoose.Types.ObjectId
    text: string
    createdAt: Date
  }[]
}

const CallSchema = new Schema<CallDoc>(
  {
    callerName: { type: String, required: true },
    phoneNumber: { type: String, required: true, index: true },
    callTime: { type: Date, required: true, index: true },
    duration: { type: Number, required: true },
    transcript: { type: String },
    recordingUrl: { type: String },
    status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: { type: [String], default: [] },
    summary: { type: String },
    category: { type: String, index: true },
    suggestion: { type: String },
    notes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
)

const CallModel = models.Call || model<CallDoc>('Call', CallSchema)
export default CallModel
