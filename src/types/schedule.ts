/**
 * Schedule and Booking Type Definitions for Mandhragiri Jothidam
 * Supports Daily Schedule, Weekly/Monthly calendar modes, time/priest layouts,
 * status tracking, and date-blocking availability.
 */

export type CalendarMode = 'week' | 'month';

export type ScheduleViewMode = 'time' | 'priest';

export type BookingCategory = 'all' | 'jathagam' | 'temple' | 'outdoor';

export type BookingStatus = 'confirmed' | 'upcoming' | 'pending' | 'completed' | 'cancelled';

export type VenueType = 'home' | 'temple' | 'hall' | 'other';
export type SamagriProvider = 'customer' | 'priest';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface EventTypeItem {
  id: string;
  nameEnglish: string;
  nameTamil: string;
  category: BookingCategory;
  defaultDurationMinutes: number;
  basePrice: number;
}

export interface BookingPaymentTransaction {
  id: string;
  bookingId: string;
  staffId?: string | null;
  staffNameTamil?: string | null;
  staffNameEnglish?: string | null;
  party: 'client' | 'priest';
  amount: number;
  paymentMethod: string;
  transactionType: string;
  reference?: string | null;
  notes?: string | null;
  paidAt: string;
  createdBy?: string | null;
}

export interface ConflictItem {
  bookingId: number;
  bookingNumber?: string;
  eventName: string;
  priestId: string;
  priestName: string;
  dateKey?: string;
  startTime: string;
  endTime: string;
  timeSlot?: string;
}

export interface AvailabilityCheckResult {
  available: boolean;
  calculatedEndTime: string;
  calculatedEndTime24?: string;
  timeSlot?: string;
  durationMinutes?: number;
  conflicts: ConflictItem[];
}

export interface ScheduleBooking {
  id: string;
  bookingNumber?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30 AM - 10:30 AM" or "07:00 AM - 12:00 AM (Next Day)"
  startTime: string; // "09:30 AM"
  endTime: string; // "10:30 AM"
  durationMinutes?: number;
  daysOffset?: number;
  startDateTime?: string;
  endDateTime?: string;
  titleTamil: string; // e.g. "ஜாதக கணிப்பு & பலன் பார்த்தல்"
  titleEnglish?: string; // "Jathagam Consultation"
  title?: string;
  eventTypeId?: string | null;
  eventTypeNameEnglish?: string | null;
  eventTypeNameTamil?: string | null;
  category: BookingCategory;
  categoryLabelTamil: string; // e.g. "ஜாதகம்"
  status: BookingStatus;
  statusLabelTamil: string; // e.g. "உறுதி செய்யப்பட்டது"
  clientName: string; // e.g. "திரு. சுந்தரேசன் குடும்பத்தார்"
  clientPhone: string; // e.g. "+91 98421 55678"
  alternatePhone?: string | null;
  venueType?: VenueType;
  locationTamil: string; // e.g. "ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்"
  locationEnglish?: string;
  location?: string;
  address?: string | null;
  area?: string | null;
  pincode?: string | null;
  samagriBy?: SamagriProvider;
  notesTamil?: string;
  notes?: string | null;
  priestId?: string;

  priestNameTamil: string; // e.g. "சுவாமி சுந்தரமூர்த்தி குருக்கள்"
  priestNameEnglish?: string;
  priestName?: string;
  priestPhone?: string;
  amount?: string;
  nakshatra?: string;
  rasipalanSummary?: string;

  // Payment Tracking Fields
  totalEventCharge?: number; // நிகழ்வு மொத்தக் கட்டணம்
  clientAdvanceAmount?: number; // Charge Advance: வாடிக்கையாளர் முன்பணம்
  clientTotalReceived?: number; // Total Payment Received from Client: வாடிக்கையாளரிடமிருந்து பெறப்பட்ட மொத்தத் தொகை
  clientBalanceAmount?: number; // Client Balance: Total Event Charge - Total Payment Received
  clientPaymentStatus?: PaymentStatus;
  priestTotalPay?: number; // Total Pay for Priest: புரோகிதருக்கு வழங்க வேண்டிய மொத்தத் தொகை
  priestAdvancePaid?: number; // Advance Paid to Priest: புரோகிதருக்கு வழங்கிய முன்பணம்
  priestBalanceAmount?: number; // Priest Balance: Total Pay for Priest - Advance Paid to Priest
  priestPaymentStatus?: PaymentStatus;

  transactions?: BookingPaymentTransaction[];
  assignedPriests?: Array<{
    id: number;
    staffId: number;
    isPrimary: number;
    priestPay: number;
    advancePaid: number;
    staffNameEnglish?: string;
    staffNameTamil?: string;
    staffPhone?: string;
  }>;
}


export interface ScheduleBlock {
  id: string;
  date: string; // YYYY-MM-DD
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  reasonTamil: string;
  reasonEnglish?: string;
  blockedBy?: string;
}

export interface DateBookingSummary {
  date: string; // YYYY-MM-DD
  total: number;
  confirmed: number;
  pending: number;
  upcoming: number;
  completed: number;
  isBlocked: boolean;
  isMuhurtham: boolean;
}

export interface CategoryFilterItem {
  id: BookingCategory;
  labelTamil: string;
  labelEnglish: string;
  count: number;
}

export interface FinancialAuditSummaryData {
  totalBookings: number;
  totalBilled: number;
  totalCollected: number;
  clientOutstanding: number;
  priestTotalDue: number;
  priestSettled: number;
  priestPendingSettlement: number;
  netPeedamMargin: number;
  fullyPaidCount: number;
  partialPaidCount: number;
  pendingPaidCount: number;
  priestSettledCount: number;
  priestPendingCount: number;
}

export interface ClientReceivableItem {
  id: string;
  bookingNumber: string;
  dateKey: string;
  title: string;
  clientName: string;
  clientPhone: string;
  location?: string;
  priestName?: string;
  totalEventCharge: number;
  clientAdvanceAmount: number;
  clientTotalReceived: number;
  clientBalanceAmount: number;
  clientPaymentStatus: PaymentStatus;
  status: BookingStatus;
}

export interface PriestSettlementItem {
  priestId: string;
  priestName: string;
  priestNameTamil: string;
  phone?: string | null;
  staffRole?: string;
  bookingCount: number;
  totalPay: number;
  advancePaid: number;
  balanceDue: number;
  settlementStatus: 'settled' | 'partial' | 'pending';
}

export interface FinancialAuditTransactionItem {
  id: string;
  bookingId: string;
  bookingNumber?: string;
  title?: string;
  clientName?: string;
  staffId?: string | null;
  staffName?: string | null;
  staffNameTamil?: string | null;
  party: 'client' | 'priest';
  amount: number;
  paymentMethod: string;
  transactionType: string;
  reference?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdByName?: string | null;
}
