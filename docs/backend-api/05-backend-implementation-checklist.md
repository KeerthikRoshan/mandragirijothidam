# Manthiragiri Jothidam — Backend Implementation Checklist & Handoff

**Document Version:** 1.0.0  
**Project:** Manthiragiri Jothidam (மாந்திரகிரி ஜோதிடம்)  
**Target Audience:** Backend Lead, API Developers & QA Engineers  
**Classification:** Technical Architecture Specification  

---

## 1. Implementation Phasing & Parallel Development Plan

To enable the React Native team and backend team to work concurrently without bottlenecks, implementation is structured into three clear phases:

```mermaid
graph TD
  subgraph Phase 1: Core Operations [P0 - Days 1 to 7]
    P1_1[Database Migrations & Seed Data]
    P1_2[Auth: Admin & Staff Login JWT]
    P1_3[Staff Directory: CRUD & Dropdown]
    P1_4[Bookings & Daily Schedule Timeline]
    P1_5[Attendance: Daily Matrix & Self-Swipe]
  end

  subgraph Phase 2: Operations & Governance [P1 - Days 8 to 14]
    P2_1[Payments: Ledger Transactions & Balance Math]
    P2_2[Leaves: Staff Apply & Admin Approval Audit]
    P2_3[Panchangam: Daily Astro Data & Locations]
    P2_4[Reminders: Staff Checklist & Triggers]
  end

  subgraph Phase 3: Analytics & Refinements [P2 - Days 15 to 20]
    P3_1[Dashboard Overview Metrics Aggregator]
    P3_2[Admin Profile & Peedam Configuration]
    P3_3[Push Notifications & SMS/WhatsApp Hooks]
    P3_4[Stress & Concurrency Testing]
  end

  Phase 1 --> Phase 2
  Phase 2 --> Phase 3
```

---

## 2. Phase 1 (P0): Core Foundations & Critical Path

---

### [P0-01] Database Schema Setup & Seed Migration
- **Priority:** `P0`
- **Dependencies:** None.
- **Scope:** Create tables `admin_users`, `staff`, `clients`, `event_bookings`, `payment_transactions`, `attendance_records`, `leave_requests`, `staff_reminders`, `schedule_blocks`.
- **Database Seed:**
  - Create default Admin: `சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்` (`phone: 9840123456`).
  - Seed 5 initial staff: Murugan, Shastriji, Ramu, Sundaram, Venkat matching [`src/data/priestMockData.ts`](file:///d:/keerthik/WORK/mandragirijothidam/src/data/priestMockData.ts).
- **Acceptance Criteria:**
  - Pass all migrations in PostgreSQL / MySQL.
  - Foreign keys and compound unique constraints enforced.

---

### [P0-02] Admin Sign In (`POST /api/v1/auth/login`)
- **Priority:** `P0`
- **Dependencies:** [P0-01]
- **Acceptance Criteria:**
  - Validates 10-digit Indian mobile number format.
  - Returns signed JWT containing `userId`, `role: "admin"`.
  - Rejects unknown numbers or mismatched passwords with `401 Unauthorized`.
  - Rate-limited to max 5 failed attempts per 15 minutes per IP/mobile.

---

### [P0-03] Staff Sign In (`POST /api/v1/auth/staff-login`)
- **Priority:** `P0`
- **Dependencies:** [P0-01]
- **Acceptance Criteria:**
  - Validates credentials against `staff` table.
  - Returns signed JWT containing `userId`, `staffId`, `role: "staff"`.
  - Rejects inactive staff accounts with `403 Forbidden` (`தங்கள் பணியாளர் கணக்கு தற்போது முடக்கப்பட்டுள்ளது`).

---

### [P0-04] Staff Directory & Dropdown (`GET /api/v1/staff`, `GET /api/v1/staff/dropdown`)
- **Priority:** `P0`
- **Dependencies:** [P0-01]
- **Acceptance Criteria:**
  - `GET /api/v1/staff` returns full staff cards, metrics, and tab counts.
  - `GET /api/v1/staff/dropdown` returns lightweight list `[{ id, nameTamil, designationTamil, roleBadge, phone }]` for modal pickers.
  - Filters by search query and active status.

---

### [P0-05] Register New Priest or Assistant (`POST /api/v1/staff`)
- **Priority:** `P0`
- **Dependencies:** [P0-04]
- **Acceptance Criteria:**
  - Enforces mandatory `nameEnglish`, `nameTamil`, `phone`, `designationTamil`.
  - Prevents duplicate staff phone numbers with `409 Conflict`.
  - Creates staff with initial status `'active'`.

---

### [P0-06] Get Daily Schedule Bookings (`GET /api/v1/schedule/bookings`)
- **Priority:** `P0`
- **Dependencies:** [P0-01]
- **Acceptance Criteria:**
  - Returns bookings strictly matching query parameter `date=YYYY-MM-DD`.
  - Supports filtering by category (`jathagam`, `temple`, `outdoor`).
  - Returns dynamic summary counts (`total`, `confirmed`, `pending`, `upcoming`, `completed`).

---

### [P0-07] Create Event / Pooja Booking (`POST /api/v1/bookings`)
- **Priority:** `P0`
- **Dependencies:** [P0-04], [P0-06]
- **Acceptance Criteria:**
  - Validates date format `/^\d{4}-\d{2}-\d{2}$/`.
  - Enforces conflict check: blocks booking if priest is already booked for overlapping slot.
  - Validates payment bounds: `clientAdvanceAmount <= totalEventCharge`.
  - Automatically calculates `clientBalanceAmount` and `priestBalanceAmount`.
  - Creates initial audit transaction in `payment_transactions` for advances $> 0$.

---

### [P0-08] Daily Staff Attendance Matrix (`GET /api/v1/attendance/daily`)
- **Priority:** `P0`
- **Dependencies:** [P0-01], [P0-04]
- **Acceptance Criteria:**
  - Returns exactly one record per active staff member for requested date.
  - If a staff member has not submitted attendance, returns synthetic status `'not_marked'`.
  - Returns accurate summary counters: `totalStaff`, `presentCount`, `absentCount`, `notMarkedCount`.

---

### [P0-09] Staff Daily Self-Attendance Swipe (`POST /api/v1/attendance/self`)
- **Priority:** `P0`
- **Dependencies:** [P0-08]
- **Acceptance Criteria:**
  - Enforces **Strict Once-Per-Day Rule**.
  - Subsequent requests on the same date return `409 Conflict`.
  - Formats current server time into `hh:mm AM/PM` as `submissionTime` if status is `'present'`.
  - Saves record with `source: 'self_swipe'`, `is_sealed: true`.

---

### [P0-10] Admin Attendance Correction (`PUT /api/v1/attendance/record`)
- **Priority:** `P0`
- **Dependencies:** [P0-08]
- **Acceptance Criteria:**
  - Admin-only access.
  - Upserts record in `attendance_records` by compound key `(staff_id, date_key)`.
  - Records updating admin identity in `updated_by`.

---

## 3. Phase 2 (P1): Operational Governance & Financials

---

### [P1-01] Staff Monthly Attendance History (`GET /api/v1/attendance/staff/{staffId}/monthly`)
- **Priority:** `P1`
- **Dependencies:** [P0-08]
- **Acceptance Criteria:**
  - Returns array of every calendar day in the requested month (`1..daysInMonth`).
  - Calculates authentic attendance percentage:
    $$\text{round}\left(\frac{\text{presentCount}}{\text{presentCount} + \text{absentCount}} \times 100\right)$$
  - Strictly isolates data to `staffId` in route path.

---

### [P1-02] Staff Leave Application (`POST /api/v1/staff/me/leaves`)
- **Priority:** `P1`
- **Dependencies:** [P0-03]
- **Acceptance Criteria:**
  - Enforces `startDate <= endDate`.
  - Checks for overlapping active leaves for the staff member; returns `409 Conflict` if duplicate found.
  - Saves with initial status `'pending'`.

---

### [P1-03] Admin Leave Governance (`GET /api/v1/leaves/admin/all`, `POST /api/v1/leaves/admin/{leaveId}/decision`)
- **Priority:** `P1`
- **Dependencies:** [P1-02]
- **Acceptance Criteria:**
  - Admin can filter leaves by `'all'`, `'pending'`, `'approved'`, `'rejected'`.
  - Decision endpoint accepts `'approved'` or `'rejected'` and optional `adminRemarks`.
  - Updates audit fields: `decided_at`, `decided_by_name`.

---

### [P1-04] Staff Portal Aggregated Dashboard (`GET /api/v1/staff/me/dashboard`)
- **Priority:** `P1`
- **Dependencies:** [P0-03], [P0-09]
- **Acceptance Criteria:**
  - Consolidates staff profile, today's attendance status, assigned poojas, and task counts into a single payload under 200ms.

---

### [P1-05] Mark Event Completed (`POST /api/v1/events/{eventId}/complete`)
- **Priority:** `P1`
- **Dependencies:** [P0-07], [P1-04]
- **Acceptance Criteria:**
  - Verifies that requesting staff member is assigned to the event.
  - Sets event status to `'completed'` and updates timestamp.
  - Automatically marks associated reminders as completed.

---

### [P1-06] Staff Reminders & Checklist (`GET /api/v1/staff/me/reminders`, `POST /api/v1/reminders/{reminderId}/complete`)
- **Priority:** `P1`
- **Dependencies:** [P1-04]
- **Acceptance Criteria:**
  - Returns preparation checklists and ritual alerts for staff.
  - Allows marking tasks completed with timestamp.

---

### [P1-07] Today's Panchangam & Muhurtham Dates (`GET /api/v1/panchangam/today`, `GET /api/v1/schedule/month-summary`)
- **Priority:** `P1`
- **Dependencies:** [P0-01]
- **Acceptance Criteria:**
  - Returns Tithi, Nakshatra, Nalla Neram, Rahu Kalam for reference location.
  - `month-summary` returns calendar dots and Muhurtham indicators matching astronomical calculations.

---

## 4. Phase 3 (P2): Analytics, Profile & System Refinements

---

### [P2-01] Dashboard Overview Metrics (`GET /api/v1/dashboard/overview`)
- **Priority:** `P2`
- **Dependencies:** [P0-06], [P0-07]
- **Acceptance Criteria:**
  - Real-time aggregations for Today's events, upcoming 7 days, pending approval, and total completed.

---

### [P2-02] Chief Administrator Profile (`GET /api/v1/admin/profile`, `PUT /api/v1/admin/profile`)
- **Priority:** `P2`
- **Dependencies:** [P0-02]
- **Acceptance Criteria:**
  - Read and update admin contact phone, email, and sanctuary address.

---

### [P2-03] Notification Bell Summary (`GET /api/v1/notifications/summary`)
- **Priority:** `P2`
- **Dependencies:** [P0-01]
- **Acceptance Criteria:**
  - Returns unread count and notification items (e.g. new leave requests, upcoming Muhurtham bookings).

---

## 5. Acceptance Test Script (Curl / Postman Quick-Check)

```bash
# 1. Admin Login
curl -X POST https://api.mandhragiri.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "+91", "mobileNumber": "9840123456", "password": "SacredPass@2026"}'

# 2. Get Staff Dropdown
curl -X GET https://api.mandhragiri.com/api/v1/staff/dropdown \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 3. Create Pooja Booking
curl -X POST https://api.mandhragiri.com/api/v1/bookings \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "dateKey": "2026-10-30",
    "title": "கணபதி ஹோமம்",
    "clientName": "கார்த்திக்",
    "phone": "+91 98401 22334",
    "location": "ஆலயம்",
    "category": "temple",
    "categoryLabelTamil": "கோவில்",
    "timeSlot": "09:00 AM - 10:30 AM",
    "priestId": "p-murugan",
    "priestName": "முருகன் சுவாமிகள்",
    "totalEventCharge": 5000,
    "clientAdvanceAmount": 1000,
    "clientTotalReceived": 1000,
    "priestTotalPay": 2500,
    "priestAdvancePaid": 500
  }'

# 4. Staff Self-Attendance Swipe
curl -X POST https://api.mandhragiri.com/api/v1/attendance/self \
  -H "Authorization: Bearer <STAFF_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"dateKey": "2026-10-30", "status": "present"}'
```
