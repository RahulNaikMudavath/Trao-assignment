import mongoose from 'mongoose';

const KitSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    source: {
      company: { type: String, default: '' },
      company_url: { type: String, default: '' },
      role: { type: String, default: '' },
      location: { type: String, default: '' },
      jd_chars: { type: Number, default: 0 },
      researched_at: { type: String, default: '' },
      pages_used: [{ type: String }],
    },
    company_brief: {
      summary: { type: String, default: '' },
      what_they_do: { type: String, default: '' },
      sources: [{ type: String }],
    },
    role: {
      title: { type: String, default: '' },
      seniority: { type: String, default: '' },
      responsibilities: [{ type: String }],
      requirements: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
          priority: { type: String, enum: ['must', 'nice'], required: true },
        },
      ],
    },
    questions: [
      {
        id: { type: String, required: true },
        requirement_ids: [{ type: String }],
        category: {
          type: String,
          enum: ['technical', 'behavioural', 'system-design', 'company-fit'],
          required: true,
        },
        prompt: { type: String, required: true },
        answer_outline: { type: String, required: true },
        difficulty: { type: Number, min: 1, max: 3, required: true },
        metadata: {
          origin: { type: String, enum: ['generated', 'user_created'] },
          status: { type: String, enum: ['unmodified', 'edited', 'pinned'] },
          user_notes: { type: String },
          pinned: { type: Boolean },
        },
      },
    ],
    flashcards: [
      {
        id: { type: String, required: true },
        front: { type: String, required: true },
        back: { type: String, required: true },
        requirement_ids: [{ type: String }],
        metadata: {
          origin: { type: String, enum: ['generated', 'user_created'] },
          status: { type: String, enum: ['unmodified', 'edited', 'pinned'] },
          confidence: { type: Number, min: 0, max: 3, default: 0 },
          last_practiced: { type: String },
          times_reviewed: { type: Number, default: 0 },
        },
      },
    ],
    schedule: {
      days_available: { type: Number, required: true },
      days: [
        {
          day: { type: Number, required: true },
          focus: { type: String, required: true },
          question_ids: [{ type: String }],
          minutes: { type: Number, required: true },
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [{ type: String }],
      passes: { type: Number, required: true },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const KitModel = mongoose.models.Kit || mongoose.model('Kit', KitSchema);
