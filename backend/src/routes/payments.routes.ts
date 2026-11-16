import { Router, Request, Response } from 'express';
import { store } from '../db/store';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public config to share Razorpay Key ID with client
router.get('/config', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    defaultUpiId: process.env.PLATFORM_UPI_ID || process.env.DEFAULT_UPI_ID || 'bookmygame@upi'
  });
});

// Create UPI / Online Payment Intent (Mockable for dev, ready for Razorpay Key ID/Secret)
router.post('/create-order', (req: Request, res: Response): void => {
  const { bookingId, amount, paymentMethod } = req.body;

  const booking = store.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found' });
    return;
  }

  // Generate a mock gateway transaction ID (e.g. order_BMG_984210)
  const orderId = `order_${booking.bookingRef}_${Date.now()}`;
  const upiId = 'bookmygame@upi';

  res.json({
    success: true,
    message: 'Payment order created',
    data: {
      orderId,
      amount: amount || booking.amount,
      currency: 'INR',
      upiId,
      upiQrPayload: `upi://pay?pa=${upiId}&pn=BookMyGame%20Kurnool&am=${booking.amount}&cu=INR&tn=Booking%20${booking.bookingRef}`,
      paymentMethod: paymentMethod || 'upi'
    }
  });
});

// Verify and mark booking as paid
router.post('/verify', (req: Request, res: Response): void => {
  const { bookingId, transactionId, paymentMethod } = req.body;

  const booking = store.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found' });
    return;
  }

  const updated = store.updateBookingStatus(booking.id, 'confirmed', 'paid');
  if (updated) {
    updated.paymentMethod = paymentMethod || 'upi';
    updated.notes = `Paid directly to venue UPI (${updated.venueOwnerUpiId || 'venue UPI'}). Txn ID: ${transactionId || 'TXN_' + Date.now()}`;
  }

  res.json({
    success: true,
    message: 'Payment verified successfully! Slot is fully paid directly to venue owner.',
    data: updated || booking
  });
});

export default router;
