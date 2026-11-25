import { Booking, Venue } from '../types';

export interface WhatsAppAlertPayload {
  message: string;
  url: string;
  targetPhone: string;
}

/**
 * Generate an instant WhatsApp alert payload for the turf owner when a booking is confirmed.
 */
export function generateOwnerWhatsAppAlert(booking: Booking, venue: Venue): WhatsAppAlertPayload {
  const cleanPhone = (venue.ownerPhone || '9876543210').replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const paymentTag = booking.paymentStatus === 'paid' ? '✅ PAID ONLINE (100% Direct UPI)' : '💵 PAY AT VENUE (Cash / UPI)';

  const message = 
`⚡ *BOOK MY GAME — NEW COURT RESERVATION* ⚡
━━━━━━━━━━━━━━━━━━━━
🏟️ *Venue:* ${venue.name}
📍 *Area:* ${venue.area}, Kurnool
📅 *Date:* ${booking.date}
⏰ *Time:* ${booking.startHour}:00 - ${booking.endHour}:00 (${booking.hours} hr)
🏅 *Sport:* ${booking.sportName}
👤 *Player Name:* ${booking.playerName}
📞 *Player Phone:* ${booking.playerPhone}
👥 *Players:* ${booking.playersCount}
💰 *Court Fee:* ₹${booking.amount} (${paymentTag})
🎫 *Pass Ref ID:* ${booking.bookingRef}
━━━━━━━━━━━━━━━━━━━━
_Show up at the ground counter for check-in._
🔗 *Operator Check-In:* https://bookmygame.kurnool.dev/#owner`;

  const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`;

  return {
    message,
    url,
    targetPhone
  };
}
