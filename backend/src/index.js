import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './storage/db.js';
import authRoutes from './routes/auth.js';
import kitRoutes from './routes/kits.js';

const app = express();

app.use(cors({
  origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    llmProvider: config.llmProvider,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);

app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred.',
  });
});

export async function startServer() {
  await initDatabase();
  const server = app.listen(config.port, () => {
    console.log(`\n Trao AI Interview Prep Kit Backend running on http://localhost:${config.port}`);
    console.log(` Client URL configured: ${config.clientUrl}`);
    console.log(` Active LLM Provider: ${config.llmProvider}`);
  });
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
