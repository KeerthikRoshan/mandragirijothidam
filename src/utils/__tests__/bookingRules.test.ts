import { isBookingEditable, getBookingLiveStatus, sortBookingsChronologically } from '../bookingRules';
import { ScheduleBooking } from '../../types/schedule';

describe('bookingRules utility tests', () => {
  const baseBooking: ScheduleBooking = {
    id: '101',
    bookingNumber: 'BK-101',
    date: '2026-11-10',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    durationMinutes: 90,
    timeSlot: '10:00 AM - 11:30 AM',
    titleTamil: 'கணபதி ஹோமம்',
    titleEnglish: 'Ganapathi Homam',
    category: 'temple',
    categoryLabelTamil: 'கோவில்',
    status: 'confirmed',
    statusLabelTamil: 'உறுதி செய்யப்பட்டது',
    clientName: 'செல்வராஜ்',
    clientPhone: '9876543210',
    locationTamil: 'ஸ்ரீ மந்திரகிரி',
    priestNameTamil: 'முருகன்',
  };

  describe('isBookingEditable', () => {
    it('rejects editing completed booking', () => {
      const b: ScheduleBooking = { ...baseBooking, status: 'completed' };
      const res = isBookingEditable(b, new Date('2026-11-01T10:00:00'));
      expect(res.isEditable).toBe(false);
      expect(res.reasonTa).toMatch(/முடிவுற்ற பதிவுகளை திருத்த முடியாது/);
    });

    it('rejects editing cancelled booking', () => {
      const b: ScheduleBooking = { ...baseBooking, status: 'cancelled' };
      const res = isBookingEditable(b, new Date('2026-11-01T10:00:00'));
      expect(res.isEditable).toBe(false);
      expect(res.reasonTa).toMatch(/ரத்து செய்யப்பட்ட பதிவுகளை திருத்த முடியாது/);
    });

    it('rejects editing booking on today', () => {
      const now = new Date('2026-11-10T08:00:00');
      const b: ScheduleBooking = { ...baseBooking, date: '2026-11-10', startTime: '06:00 PM' };
      const res = isBookingEditable(b, now);
      expect(res.isEditable).toBe(false);
      expect(res.reasonTa).toMatch(/24 மணி நேரத்திற்கு முன்பு/);
    });

    it('rejects editing booking scheduled within next 24 hours', () => {
      // Event is tomorrow Nov 11 at 9:00 AM (21 hours away)
      const now = new Date('2026-11-10T12:00:00');
      const b: ScheduleBooking = { ...baseBooking, date: '2026-11-11', startTime: '09:00 AM' };
      const res = isBookingEditable(b, now);
      expect(res.isEditable).toBe(false);
      expect(res.reasonTa).toMatch(/24 மணி நேரத்திற்கு முன்பு/);
    });

    it('rejects editing past booking', () => {
      const now = new Date('2026-11-12T10:00:00');
      const b: ScheduleBooking = { ...baseBooking, date: '2026-11-10', startTime: '10:00 AM' };
      const res = isBookingEditable(b, now);
      expect(res.isEditable).toBe(false);
    });

    it('allows editing booking scheduled more than 24 hours in future', () => {
      const now = new Date('2026-11-07T10:00:00');
      const b: ScheduleBooking = { ...baseBooking, date: '2026-11-10', startTime: '10:00 AM' };
      const res = isBookingEditable(b, now);
      expect(res.isEditable).toBe(true);
      expect(res.reasonEn).toBe('');
    });
  });

  describe('getBookingLiveStatus', () => {
    it('detects LIVE booking during event window', () => {
      const now = new Date('2026-11-10T10:30:00'); // Between 10:00 AM and 11:30 AM
      const res = getBookingLiveStatus(baseBooking, now);
      expect(res.isLive).toBe(true);
      expect(res.isPast).toBe(false);
      expect(res.isUpcoming).toBe(false);
    });

    it('detects UPCOMING booking before event start', () => {
      const now = new Date('2026-11-10T09:00:00'); // Before 10:00 AM
      const res = getBookingLiveStatus(baseBooking, now);
      expect(res.isLive).toBe(false);
      expect(res.isPast).toBe(false);
      expect(res.isUpcoming).toBe(true);
    });

    it('detects PAST booking after event end', () => {
      const now = new Date('2026-11-10T12:00:00'); // After 11:30 AM
      const res = getBookingLiveStatus(baseBooking, now);
      expect(res.isLive).toBe(false);
      expect(res.isPast).toBe(true);
      expect(res.isUpcoming).toBe(false);
    });
  });

  describe('sortBookingsChronologically', () => {
    it('sorts bookings ascending by start time', () => {
      const list: ScheduleBooking[] = [
        { ...baseBooking, id: '1', startTime: '02:00 PM' },
        { ...baseBooking, id: '2', startTime: '08:30 AM' },
        { ...baseBooking, id: '3', startTime: '11:00 AM' },
      ];
      const sorted = sortBookingsChronologically(list);
      expect(sorted.map(b => b.id)).toEqual(['2', '3', '1']);
    });
  });
});
