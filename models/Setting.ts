import { Schema, model, models } from 'mongoose'

type FAQ = {
  question: string
  answer: string
}

type EscalationRule = {
  ifCategory: string
  setPriority: 'low' | 'medium' | 'high'
}

export type Setting = {
  _id: string
  welcomeMessage: string
  faqs: FAQ[]
  escalationRules: EscalationRule[]
  updatedAt: Date
}

const SettingSchema = new Schema(
  {
    welcomeMessage: { type: String, default: 'Namaste. Please share your concern.' },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],
    escalationRules: [
      {
        ifCategory: { type: String, required: true },
        setPriority: { type: String, enum: ['low', 'medium', 'high'], required: true }
      }
    ]
  },
  { timestamps: true }
)

const SettingModel = models.Setting || model('Setting', SettingSchema)
export default SettingModel
