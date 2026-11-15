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

app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'Direct'}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const venues = store.getVenues();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platform: 'Book My Game — Kurnool Sports API',
    stats: {
      venuesCount: venues.length,
      sportsCount: store.getSports().length
    }
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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ BOOK MY GAME Server running at: http://localhost:${PORT}`);
  console.log(`🩺 Health check endpoint:        http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

export default app;
