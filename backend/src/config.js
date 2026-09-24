import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trao',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-trao-assessment-2026',

  // LLM settings
  llmProvider: (process.env.LLM_PROVIDER || 'gemini').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',

  // Crawler & Security
  allowLocalUrls: process.env.ALLOW_LOCAL_URLS === 'true' || process.env.NODE_ENV === 'test',
  crawlerTimeoutMs: parseInt(process.env.CRAWLER_TIMEOUT_MS || '10000', 10),
  maxPageBytes: parseInt(process.env.MAX_PAGE_BYTES || '2097152', 10), // 2MB max
  maxCrawlPages: 3,
};
