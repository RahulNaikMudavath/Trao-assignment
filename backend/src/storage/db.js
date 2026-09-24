import mongoose from 'mongoose';
import { config } from '../config.js';
import { UserModel } from '../models/User.js';
import { KitModel } from '../models/Kit.js';

let isMongoConnected = false;

const memoryUsers = new Map();
const memoryKits = new Map();

export async function initDatabase() {
  if (isMongoConnected) return true;

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log('[Database] Connected successfully to MongoDB.');
    return true;
  } catch (err) {
    console.warn(
      `[Database] MongoDB not available at ${config.mongodbUri} (${err.message}). Using resilient in-memory storage engine.`
    );
    isMongoConnected = false;
    return false;
  }
}

export const db = {
  async findUserByEmail(email) {
    const normalized = email.toLowerCase().trim();
    if (isMongoConnected) {
      return await UserModel.findOne({ email: normalized }).lean();
    }
    return memoryUsers.get(normalized) || null;
  },

  async createUser(userData) {
    const normalized = userData.email.toLowerCase().trim();
    if (isMongoConnected) {
      const doc = new UserModel({ ...userData, email: normalized });
      const saved = await doc.save();
      return saved.toObject();
    }
    const record = {
      _id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...userData,
      email: normalized,
      created_at: new Date(),
    };
    memoryUsers.set(normalized, record);
    return record;
  },

  async findUserById(id) {
    if (isMongoConnected) {
      return await UserModel.findById(id).lean();
    }
    for (const u of memoryUsers.values()) {
      if (u._id === id) return u;
    }
    return null;
  },

  async findKitsByUserId(userId) {
    if (isMongoConnected) {
      return await KitModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
    }
    return Array.from(memoryKits.values())
      .filter((k) => k.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async findKitById(kitId, userId) {
    if (isMongoConnected) {
      const query = { _id: kitId };
      if (userId) query.user_id = userId;
      return await KitModel.findOne(query).lean();
    }
    const found = memoryKits.get(kitId);
    if (!found) return null;
    if (userId && found.user_id !== userId) return null;
    return found;
  },

  async saveKit(userId, kit) {
    if (isMongoConnected) {
      const doc = new KitModel({
        user_id: userId,
        ...kit,
      });
      const saved = await doc.save();
      return saved.toObject();
    }
    const id = `kit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = {
      _id: id,
      user_id: userId,
      ...kit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryKits.set(id, record);
    return record;
  },

  async updateKit(kitId, userId, updates) {
    if (isMongoConnected) {
      return await KitModel.findOneAndUpdate(
        { _id: kitId, user_id: userId },
        { ...updates, updated_at: new Date() },
        { new: true }
      ).lean();
    }
    const existing = memoryKits.get(kitId);
    if (!existing || existing.user_id !== userId) return null;
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    memoryKits.set(kitId, updated);
    return updated;
  },

  async deleteKit(kitId, userId) {
    if (isMongoConnected) {
      const res = await KitModel.deleteOne({ _id: kitId, user_id: userId });
      return res.deletedCount > 0;
    }
    const existing = memoryKits.get(kitId);
    if (existing && existing.user_id === userId) {
      memoryKits.delete(kitId);
      return true;
    }
    return false;
  },
};
