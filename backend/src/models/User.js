import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
