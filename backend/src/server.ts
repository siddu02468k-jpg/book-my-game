import express, { Request, Response, NextFunction } from 'express';
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
import { apiRateLimiter } from './middleware/rateLimiter';
import { sanitizeInputs } from './middleware/sanitize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Disable framework finger-printing (Security Best Practice)
app.disable('x-powered-by');

// Trust first proxy on cloud hosts like Render
app.set('trust proxy', 1);

// CORS Policy Hardening
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/10\.0\.2\.2:\d+$/,
  /\.onrender\.com$/,
  /\.vercel\.app$/,
  /https:\/\/bookmygame\.kurnool\.dev$/
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
      if (isAllowed || !IS_PROD) {
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

// Comprehensive Security Headers (OWASP Top 10 + Helmet Standards)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; frame-src https://accounts.google.com;"
  );

  next();
});

// Protect Sensitive Internal Files from Static Serving
app.use((req: Request, res: Response, next: NextFunction) => {
  const sensitivePatterns = [
    /\.env(\..+)?$/i,
    /\.git(\/|\\)?/i,
    /\.(bak|backup|sql|db|sqlite|log|ts|map)$/i,
    /(data|package|tsconfig)\.json$/i
  ];

  if (!req.path.startsWith('/api') && sensitivePatterns.some(pat => pat.test(req.path))) {
    res.status(403).json({ success: false, error: 'Access forbidden: Protected system resource' });
    return;
  }
  next();
});

// Input Size Limits & Parsing
app.use(express.json({ limit: '5mb' })); // Allows compressed base64 images for turf verification
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input Sanitization Middleware (XSS & Injection Protection)
app.use(sanitizeInputs);

// Request Tracking
app.use((req, _res, next) => {
  monitor.recordRequest();
  const timestamp = new Date().toISOString();
  if (!IS_PROD) {
    console.log(`[${timestamp}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'Direct'}`);
  }
  next();
});

// Health & Monitoring
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

// Apply API Rate Limiting to All Endpoints
app.use('/api', apiRateLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/payments', paymentsRoutes);

// Production Static Serving
const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    maxAge: IS_PROD ? '1d' : '0',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Catch-all SPA route
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

// Production Error Handler (Turns off debug mode & stack trace leakage)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const status = err.status || 500;
  console.error(`🚨 [${timestamp}] Server Exception on ${req.method} ${req.url}:`, IS_PROD ? err.message : err.stack || err);
  monitor.recordError(err, req.method, req.url, status);

  res.status(status).json({
    success: false,
    error: IS_PROD 
      ? 'An unexpected error occurred. Please try again or contact support.'
      : (err.message || 'Internal Server Error'),
    timestamp
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ BOOK MY GAME Server running at: http://localhost:${PORT}`);
  console.log(`🩺 Health check endpoint:        http://localhost:${PORT}/api/health`);
  console.log(`🔒 Security Hardening:          Rate Limiting, XSS Sanitization & CSP Active`);
  console.log(`====================================================`);
});

export default app;
