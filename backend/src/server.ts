import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import venuesRoutes from './routes/venues.routes';
import bookingsRoutes from './routes/bookings.routes';
import ownerRoutes from './routes/owner.routes';
import paymentsRoutes from './routes/payments.routes';
import { store } from './db/store';
import { monitor } from './utils/monitoring';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^http:\/\/10\.0\.2\.2:\d+$/,
        /\.onrender\.com$/,              // Render production domains
        /\.vercel\.app$/
      ];

      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      if (isAllowed || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Security Headers Middleware (OWASP Top 10 hardening)
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

app.use(express.json({ limit: '1mb' }));

// Request logger & tracking
app.use((req, _res, next) => {
  monitor.recordRequest();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'Direct'}`);
  next();
});

// Health & System Monitoring check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const dbCounts = store.getCounts();
  const metrics = monitor.getMetrics(dbCounts);
  res.json({
    status: metrics.status,
    timestamp: new Date().toISOString(),
    platform: 'Book My Game — Kurnool Sports API',
    uptime: metrics.uptimeFormatted,
    uptimeSeconds: metrics.uptimeSeconds,
    totalRequests: metrics.totalRequests,
    errorCount: metrics.errorCount,
    memory: metrics.memory,
    lastBackup: metrics.lastBackup,
    database: metrics.database
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/payments', paymentsRoutes);

// Production Static Serving for Render / Heroku / Full-Stack deployment
const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Catch-all for SPA routes (e.g. /venues, /bookings)
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ success: false, error: 'API endpoint not found' });
      return;
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });
}

// Centralized Production Error Monitoring & Logging Middleware
app.use((err: any, req: Request, res: Response, _next: any) => {
  const timestamp = new Date().toISOString();
  const status = err.status || 500;
  console.error(`🚨 [${timestamp}] Server Exception on ${req.method} ${req.url}:`, err.stack || err);
  monitor.recordError(err, req.method, req.url, status);

  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error. Please retry or contact support.',
    timestamp
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ BOOK MY GAME Server running at: http://localhost:${PORT}`);
  console.log(`🩺 Health check endpoint:        http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

export default app;
