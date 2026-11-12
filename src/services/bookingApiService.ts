/**
 * Booking API Service for Mandhragiri Jothidam
 * Fully dynamic database-to-frontend integration for Event/Pooja bookings,
 * real-time availability/conflict detection, and manual offline cash payment tracking.
 */

import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';
import {
  AvailabilityCheckResult,
  BookingPaymentTransaction,
  EventTypeItem,
  ScheduleBooking,
  FinancialAuditSummaryData,
  ClientReceivableItem,
  PriestSettlementItem,
  FinancialAuditTransactionItem,
} from '../types/schedule';

/**
 * Format raw backend booking response into typed frontend ScheduleBooking.
 */
export function mapBackendBooking(row: any): ScheduleBooking {
  const totalCharge = Number(row.financials?.totalEventCharge ?? row.totalEventCharge ?? row.total_event_charge ?? 0);
  const clientReceived = Number(row.financials?.clientTotalReceived ?? row.clientTotalReceived ?? row.client_total_received ?? 0);
  const clientAdvance = Number(row.financials?.clientAdvanceAmount ?? row.clientAdvanceAmount ?? row.client_advance_amount ?? 0);
  const clientBalance = Number(row.financials?.clientBalanceAmount ?? (totalCharge - clientReceived));

  const priestTotal = Number(row.financials?.priestTotalPay ?? row.priestTotalPay ?? row.priest_total_pay ?? 0);
  const priestAdvance = Number(row.financials?.priestAdvancePaid ?? row.priestAdvancePaid ?? row.priest_advance_paid ?? 0);
  const priestBalance = Number(row.financials?.priestBalanceAmount ?? (priestTotal - priestAdvance));

  const status = (row.status || 'confirmed').toLowerCase();
  const dateKey = row.dateKey || row.date_key || row.date || '';

  return {
    id: String(row.id),
    bookingNumber: row.bookingNumber || row.booking_number,
    date: dateKey,
    endDate: row.endDate || row.end_date || dateKey,
    timeSlot: row.timeSlot || row.time_slot || `${row.startTime || row.start_time} - ${row.endTime || row.end_time}`,
    startTime: row.startTime || row.start_time || '09:00 AM',
    endTime: row.endTime || row.end_time || '10:00 AM',
    durationMinutes: Number(row.durationMinutes || row.duration_minutes || 60),
    daysOffset: Number(row.daysOffset || row.days_offset || 0),
    startDateTime: row.startDateTime || row.start_date_time,
    endDateTime: row.endDateTime || row.end_date_time,
    titleTamil: row.titleTamil || row.title || 'பூஜை நிகழ்வு',
    titleEnglish: row.titleEnglish || row.title || 'Pooja Event',
    eventTypeId: row.eventTypeId ? String(row.eventTypeId) : null,
    eventTypeNameEnglish: row.eventTypeNameEnglish,
    eventTypeNameTamil: row.eventTypeNameTamil,
    category: row.category || 'outdoor',
    categoryLabelTamil: row.categoryLabelTamil || row.category_label_tamil || 'நிகழ்வு',
    status,
    statusLabelTamil:
      status === 'completed'
        ? 'முடிவுற்றது'
        : status === 'pending'
        ? 'நிலுவையில்'
        : status === 'cancelled'
        ? 'ரத்து செய்யப்பட்டது'
        : 'உறுதி செய்யப்பட்டது',
    clientName: row.clientName || row.client_name || '',
    clientPhone: row.clientPhone || row.client_phone || '',
    alternatePhone: row.alternatePhone || row.alternate_phone || null,
    venueType: row.venueType || row.venue_type || 'home',
    locationTamil: row.locationTamil || row.location || 'ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்',
    address: row.address || null,
    area: row.area || null,
    pincode: row.pincode || null,
    samagriBy: row.samagriBy || row.samagri_by || 'customer',
    notesTamil: row.notes || row.notesTamil || row.completion_notes || '',
    notes: row.notes || null,
    priestId: row.priestId ? String(row.priestId) : undefined,
    priestNameTamil: row.priestNameTamil || row.priestName || row.priest_name || 'சுவாமி',
    priestPhone: row.priestPhone || row.priest_phone,
    amount: totalCharge > 0 ? `₹ ${totalCharge.toLocaleString('en-IN')}` : undefined,
    totalEventCharge: totalCharge,
    clientAdvanceAmount: clientAdvance,
    clientTotalReceived: clientReceived,
    clientBalanceAmount: clientBalance,
    clientPaymentStatus: row.financials?.clientPaymentStatus || row.client_payment_status || (clientReceived >= totalCharge ? 'paid' : (clientReceived > 0 ? 'partial' : 'pending')),
    priestTotalPay: priestTotal,
    priestAdvancePaid: priestAdvance,
    priestBalanceAmount: priestBalance,
    priestPaymentStatus: row.financials?.priestPaymentStatus || row.priest_payment_status || (priestAdvance >= priestTotal ? 'paid' : (priestAdvance > 0 ? 'partial' : 'pending')),
    transactions: (row.transactions || []).map((t: any) => ({
      id: String(t.id),
      bookingId: String(t.booking_id || t.bookingId),
      staffId: t.staff_id ? String(t.staff_id) : null,
      staffNameTamil: t.staff_name_tamil || null,
      staffNameEnglish: t.staff_name_english || null,
      party: (t.party || 'client').toLowerCase(),
      amount: Number(t.amount || 0),
      paymentMethod: t.payment_method || t.paymentMethod || 'cash',
      transactionType: t.transaction_type || t.transactionType || 'ADVANCE',
      reference: t.reference || null,
      notes: t.notes || null,
      paidAt: t.paid_at || t.paidAt || new Date().toISOString(),
      createdBy: t.created_by ? String(t.created_by) : null,
    })),
    assignedPriests: row.assignedPriests || [],
  };
}

export const bookingApiService = {
  /**
   * Fetch all configured Pooja and Event types from backend.
   */
  async getEventTypes(): Promise<EventTypeItem[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.EVENT_TYPES);
      if (response.data?.success && response.data?.data?.eventTypes) {
        return response.data.data.eventTypes.map((et: any) => ({
          id: String(et.id),
          nameEnglish: et.nameEnglish,
          nameTamil: et.nameTamil,
          category: et.category,
          defaultDurationMinutes: Number(et.defaultDurationMinutes || 120),
          basePrice: Number(et.basePrice || 0),
        }));
      }
    } catch (err) {
      console.warn('⚠️ [bookingApiService] Failed to fetch event types:', err);
    }
    // Fallback default pooja choices if offline/unreachable
    return [
      { id: '1', nameEnglish: 'Horoscope & Prasannam', nameTamil: 'ஜாதகம் & பிரசன்னம்', category: 'jathagam', defaultDurationMinutes: 60, basePrice: 1000 },
      { id: '2', nameEnglish: 'Ganapathi Homam', nameTamil: 'கணபதி ஹோமம்', category: 'temple', defaultDurationMinutes: 120, basePrice: 5000 },
      { id: '3', nameEnglish: 'Navagraha Homam', nameTamil: 'நவக்கிரக ஹோமம்', category: 'temple', defaultDurationMinutes: 120, basePrice: 6000 },
      { id: '4', nameEnglish: 'Sudarshana Homam', nameTamil: 'சுதர்சன ஹோமம்', category: 'temple', defaultDurationMinutes: 180, basePrice: 7500 },
      { id: '5', nameEnglish: 'Ayushya Homam', nameTamil: 'ஆயுஷ்ய ஹோமம்', category: 'temple', defaultDurationMinutes: 180, basePrice: 6500 },
      { id: '6', nameEnglish: 'Grihapravesam & Vastu', nameTamil: 'கிரகப்பிரவேசம் & வாஸ்து', category: 'outdoor', defaultDurationMinutes: 180, basePrice: 8000 },
      { id: '7', nameEnglish: 'Marriage Muhurtham', nameTamil: 'திருமண முகூர்த்தம்', category: 'outdoor', defaultDurationMinutes: 240, basePrice: 15000 },
      { id: '8', nameEnglish: 'Temple Abhishekam', nameTamil: 'கோவில் அபிஷேகம் & அர்ச்சனை', category: 'temple', defaultDurationMinutes: 60, basePrice: 2500 },
      { id: '9', nameEnglish: 'Special Outdoor Pooja', nameTamil: 'சிறப்பு வெளி நிகழ்வு பூஜை', category: 'outdoor', defaultDurationMinutes: 120, basePrice: 5000 },
    ];
  },

  /**
   * Check priest availability & time-slot collision for requested date, time, and duration.
   */
  async checkAvailability(params: {
    booking_date: string;
    start_time: string;
    duration_minutes: number;
    priest_ids: string[];
    exclude_booking_id?: number | string | null;
  }): Promise<AvailabilityCheckResult> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.BOOKINGS.CHECK_AVAILABILITY, params);
      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        return {
          available: Boolean(d.available),
          calculatedEndTime: d.calculated_end_time || '',
          calculatedEndTime24: d.calculated_end_time_24,
          timeSlot: d.time_slot,
          durationMinutes: d.duration_minutes,
          conflicts: (d.conflicts || []).map((c: any) => ({
            bookingId: c.bookingId || c.booking_id,
            bookingNumber: c.bookingNumber || c.booking_number,
            eventName: c.eventName || c.event_name,
            priestId: String(c.priestId || c.priest_id),
            priestName: c.priestName || c.priest_name,
            startTime: c.startTime || c.start_time,
            endTime: c.endTime || c.end_time,
            timeSlot: c.timeSlot || c.time_slot,
          })),
        };
      }
    } catch (err: any) {
      console.warn('⚠️ [bookingApiService] Check availability failed:', err?.response?.data || err.message);
    }
    return {
      available: true,
      calculatedEndTime: '',
      conflicts: [],
    };
  },

  /**
   * Create a new booking on the backend database.
   */
  async createBooking(payload: any): Promise<ScheduleBooking> {
    console.log('📤 [bookingApiService.createBooking] Outgoing Payload:', JSON.stringify(payload, null, 2));
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.BOOKINGS.CREATE, payload);
      console.log('📥 [bookingApiService.createBooking] Response:', response.data);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to register booking');
      }
      return mapBackendBooking(response.data.data);
    } catch (err: any) {
      console.error('❌ [bookingApiService.createBooking] API Error:', err?.response?.data || err.message);
      const errors = err?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const errorDetails = Object.entries(errors)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join('\n');
        throw new Error(`${err?.response?.data?.message || 'Validation failed'}:\n${errorDetails}`);
      }
      throw new Error(err?.response?.data?.message || err?.message || 'Failed to register booking');
    }
  },

  /**
   * Retrieve all bookings with optional filters (date, date range, priest, status, category, search).
   */
  async listBookings(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    priestId?: string | number;
    status?: string;
    category?: string;
    search?: string;
    view?: string;
  }): Promise<ScheduleBooking[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.LIST, { params });
      if (response.data?.success && response.data?.data?.bookings) {
        return response.data.data.bookings.map(mapBackendBooking);
      }
    } catch (err: any) {
      console.warn('⚠️ [bookingApiService] Live GET /bookings failed:', err?.response?.data || err.message);
    }
    return [];
  },

  /**
   * Retrieve bookings by specific date.
   */
  async getBookingsByDate(dateKey: string): Promise<ScheduleBooking[]> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.BY_DATE(dateKey));
      if (response.data?.success && response.data?.data?.bookings) {
        return response.data.data.bookings.map(mapBackendBooking);
      }
    } catch (err: any) {
      console.warn(`⚠️ [bookingApiService] Live GET /bookings?date=${dateKey} failed:`, err?.response?.data || err.message);
    }
    return [];
  },

  /**
   * Retrieve all bookings assigned to a specific priest.
   */
  async getPriestBookings(priestId: string | number, date?: string): Promise<ScheduleBooking[]> {
    try {
      const url = API_CONFIG.ENDPOINTS.BOOKINGS.BY_PRIEST(priestId);
      const response = await apiClient.get(url, { params: date ? { date } : {} });
      if (response.data?.success && response.data?.data?.bookings) {
        return response.data.data.bookings.map(mapBackendBooking);
      }
    } catch (err: any) {
      console.warn(`⚠️ [bookingApiService] Live GET /bookings/priest/${priestId} failed:`, err?.response?.data || err.message);
    }
    return [];
  },

  /**
   * Retrieve complete booking details by ID including full transaction history.
   */
  async getBookingDetails(bookingId: string | number): Promise<ScheduleBooking> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.DETAILS(bookingId));
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Failed to fetch booking details');
    }
    return mapBackendBooking(response.data.data);
  },

  /**
   * Update an existing booking.
   */
  async updateBooking(bookingId: string | number, payload: any): Promise<ScheduleBooking> {
    console.log(`📤 [bookingApiService.updateBooking] Outgoing Payload for ID ${bookingId}:`, JSON.stringify(payload, null, 2));
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.BOOKINGS.UPDATE(bookingId), payload);
      console.log(`📥 [bookingApiService.updateBooking] Response:`, response.data);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update booking');
      }
      return mapBackendBooking(response.data.data);
    } catch (err: any) {
      console.error(`❌ [bookingApiService.updateBooking] API Error:`, err?.response?.data || err.message);
      const resData = err?.response?.data;
      if (resData?.errors && typeof resData.errors === 'object') {
        if (resData.errors.collision) {
          throw new Error(`${resData.message || 'Time slot conflict'}: ${resData.errors.collision}`);
        }
        const errorDetails = Object.entries(resData.errors)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join('\n');
        throw new Error(`${resData.message || 'Validation failed'}:\n${errorDetails}`);
      }
      throw new Error(resData?.message || err?.message || 'Failed to update booking');
    }
  },

  /**
   * Record a subsequent manual cash payment (Customer payment or Priest remuneration).
   */
  async recordPayment(bookingId: string | number, paymentData: {
    party: 'CLIENT' | 'PRIEST';
    amount: number;
    paymentMethod?: string;
    notes?: string;
    staffId?: string | number | null;
  }): Promise<{
    transactionId: string;
    bookingId: string;
    party: string;
    amount: number;
    updatedTotalReceived: number;
    updatedPaymentStatus: string;
    financials: any;
  }> {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.BOOKINGS.PAYMENTS(bookingId), paymentData);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Failed to record cash payment');
    }
    return response.data.data;
  },

  /**
   * Retrieve payment transaction history for a booking.
   */
  async getBookingPayments(bookingId: string | number): Promise<BookingPaymentTransaction[]> {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.PAYMENTS(bookingId));
    if (response.data?.success && response.data?.data?.payments) {
      return response.data.data.payments.map((t: any) => ({
        id: String(t.id),
        bookingId: String(t.bookingId || t.booking_id),
        staffId: t.staffId ? String(t.staffId) : null,
        staffNameTamil: t.staffNameTamil || null,
        staffNameEnglish: t.staffNameEnglish || null,
        party: (t.party || 'client').toLowerCase(),
        amount: Number(t.amount || 0),
        paymentMethod: t.paymentMethod || 'cash',
        transactionType: t.transactionType || 'ADVANCE',
        reference: t.reference || null,
        notes: t.notes || null,
        paidAt: t.paidAt || new Date().toISOString(),
        createdBy: t.createdBy ? String(t.createdBy) : null,
      }));
    }
    return [];
  },

  /**
   * Fetch aggregate financial audit summary and client receivables.
   */
  async getFinancialAuditSummary(params?: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    month?: string;
  }): Promise<{
    summary: FinancialAuditSummaryData;
    receivables: ClientReceivableItem[];
    count: number;
  }> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.FINANCIAL_AUDITS_SUMMARY, { params });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      console.warn('⚠️ [bookingApiService] getFinancialAuditSummary failed:', err?.response?.data || err.message);
    }
    return {
      summary: {
        totalBookings: 0,
        totalBilled: 0,
        totalCollected: 0,
        clientOutstanding: 0,
        priestTotalDue: 0,
        priestSettled: 0,
        priestPendingSettlement: 0,
        netPeedamMargin: 0,
        fullyPaidCount: 0,
        partialPaidCount: 0,
        pendingPaidCount: 0,
        priestSettledCount: 0,
        priestPendingCount: 0,
      },
      receivables: [],
      count: 0,
    };
  },

  /**
   * Fetch priest compensation and pending settlement status.
   */
  async getPriestSettlements(params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    settlements: PriestSettlementItem[];
    count: number;
  }> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.FINANCIAL_AUDITS_SETTLEMENTS, { params });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      console.warn('⚠️ [bookingApiService] getPriestSettlements failed:', err?.response?.data || err.message);
    }
    return {
      settlements: [],
      count: 0,
    };
  },

  /**
   * Fetch unified ledger transactions for financial audit.
   */
  async getFinancialAuditTransactions(params?: {
    fromDate?: string;
    toDate?: string;
    party?: 'client' | 'priest';
    search?: string;
    limit?: number;
  }): Promise<{
    transactions: FinancialAuditTransactionItem[];
    count: number;
  }> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.FINANCIAL_AUDITS_TRANSACTIONS, { params });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      console.warn('⚠️ [bookingApiService] getFinancialAuditTransactions failed:', err?.response?.data || err.message);
    }
    return {
      transactions: [],
      count: 0,
    };
  },
};
