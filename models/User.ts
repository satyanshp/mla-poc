import mongoose, { Schema, model, models } from 'mongoose'

export type User = {
  _id: string
  name: string
  email: string
  role: 'admin' | 'staff'
}

type UserDoc = mongoose.Document & {
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'staff'
}

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], required: true, default: 'staff' }
  },
  { timestamps: true }
)

const UserModel = models.User || model<UserDoc>('User', UserSchema)
export default UserModel
