# Manthiragiri Jothidam — API Endpoint Catalog & Screen-to-API Mapping

**Document Version:** 1.0.0  
**Project:** Manthiragiri Jothidam (மாந்திரகிரி ஜோதிடம்)  
**Target Audience:** Backend Engineering Team & Mobile Integration Engineers  
**Classification:** Technical Architecture Specification  

---

## 1. Classification & Status Legend

Every endpoint documented in this specification is categorized with one of the three following status designations:
- **`Existing API (Local Boundary)`**: An interface or service boundary already implemented in the React Native project (e.g. AsyncStorage caching or mocked service functions) that requires replacement with a live network backend endpoint.
- **`Required API`**: A mandatory operational endpoint directly expected by UI buttons, modal submissions, or dashboard widgets, with no current backend implementation.
- **`Proposed Contract`**: A recommended architectural endpoint designed to consolidate data, optimize mobile round-trips, or structure database relationships, subject to backend engineering agreement.

---

## 2. Screen-to-API Mapping Master Table

| Screen / Feature | User Action | API Name | HTTP Method | Endpoint | Status |
|---|---|---|---|---|---|
| **SplashScreen** | App launch / Token check | Verify Session Token | `GET` | `/api/v1/auth/verify-token` | Proposed Contract |
| **SplashScreen** | Check system health & config | Get System Configuration | `GET` | `/api/v1/system/config` | Proposed Contract |
| **LoginScreen** | Submit Admin credentials | Admin Sign In | `POST` | `/api/v1/auth/login` | Required API |
| **LoginScreen** | Submit Staff credentials | Staff Sign In | `POST` | `/api/v1/auth/staff-login` | Required API |
| **LoginScreen** | Tap "Forgot Password" | Request Password Reset OTP | `POST` | `/api/v1/auth/forgot-password` | Required API |
| **DashboardScreen** | Screen load / Pull-to-refresh | Get Dashboard Overview Metrics | `GET` | `/api/v1/dashboard/overview` | Required API |
| **DashboardScreen** | Screen load | Get Today's Panchangam | `GET` | `/api/v1/panchangam/today` | Required API |
| **DashboardScreen** | Screen load | Get Today's Events & Live Op | `GET` | `/api/v1/bookings/today` | Required API |
| **DashboardScreen** | Tap Notification Bell | Get Notifications Summary | `GET` | `/api/v1/notifications/summary` | Proposed Contract |
| **DashboardScreen** | Tap "View Full Panchangam" | Get Full Panchangam Details | `GET` | `/api/v1/panchangam/details` | Proposed Contract |
| **DailyScheduleScreen** | Screen load / Date select | Get Date Schedule Bookings | `GET` | `/api/v1/schedule/bookings` | Required API |
| **DailyScheduleScreen** | Open Monthly Calendar | Get Month Calendar Summary | `GET` | `/api/v1/schedule/month-summary` | Required API |
| **DailyScheduleScreen** | Check booking availability | Validate Booking Collision | `POST` | `/api/v1/schedule/validate-slot` | Required API |
| **DailyScheduleScreen** | Select date | Get Tamil Date & Muhurtham Info | `GET` | `/api/v1/calendar/tamil-date-info` | Existing API (Local Boundary) |
| **PoojaBookingFormModal** | Open modal | Get Active Staff for Dropdown | `GET` | `/api/v1/staff/dropdown` | Required API |
| **PoojaBookingFormModal** | Submit new booking | Create Event Booking | `POST` | `/api/v1/bookings` | Required API |
| **PoojaBookingFormModal** | Save edited booking | Update Event Booking | `PUT` | `/api/v1/bookings/{bookingId}` | Required API |
| **PriestScreen** | Screen load / Search | Get Priests & Assistants List | `GET` | `/api/v1/staff` | Required API |
| **PriestScreen** | Switch tabs (Past, Today, Next) | Get Priest Assigned Bookings | `GET` | `/api/v1/staff/{staffId}/bookings` | Required API |
| **PriestScreen** | Tap Call Button | Log Staff Call Activity | `POST` | `/api/v1/staff/{staffId}/log-call` | Proposed Contract |
| **AddPriestModal** | Submit new staff form | Create Priest or Assistant | `POST` | `/api/v1/staff` | Required API |
| **AttendanceManagementScreen** | Date navigate / Day load | Get Date Staff Attendance | `GET` | `/api/v1/attendance/daily` | Existing API (Local Boundary) |
| **AttendanceManagementScreen** | Screen load | Get Date Attendance Summary | `GET` | `/api/v1/attendance/summary` | Existing API (Local Boundary) |
| **AttendanceManagementScreen** | Edit status in modal | Update Staff Attendance Record | `PUT` | `/api/v1/attendance/record` | Existing API (Local Boundary) |
| **StaffAttendanceDetailScreen** | Screen load / Month navigate | Get Staff Monthly Attendance | `GET` | `/api/v1/attendance/staff/{staffId}/monthly` | Existing API (Local Boundary) |
| **StaffAttendanceDetailScreen** | Admin edit past attendance | Update Staff Attendance Record | `PUT` | `/api/v1/attendance/record` | Existing API (Local Boundary) |
| **AdminLeaveManagementScreen** | Screen load / Tab filter | Get All Staff Leave Requests | `GET` | `/api/v1/leaves/admin/all` | Existing API (Local Boundary) |
| **AdminLeaveManagementScreen** | Tap Approve / Reject | Decide Leave Request | `POST` | `/api/v1/leaves/admin/{leaveId}/decision` | Existing API (Local Boundary) |
| **ProfileScreen** | Screen load | Get Admin Profile & Peedam | `GET` | `/api/v1/admin/profile` | Required API |
| **ProfileScreen** | Edit modal submit | Update Admin Profile Details | `PUT` | `/api/v1/admin/profile` | Required API |
| **SettingsScreen** | Screen load | Get App Settings & Counters | `GET` | `/api/v1/settings/organization` | Required API |
| **SettingsScreen** | Select city in modal | Update Calendar Location | `PUT` | `/api/v1/settings/calendar-location` | Required API |
| **SettingsScreen** | Tap Sign Out & Confirm | Admin Sign Out | `POST` | `/api/v1/auth/logout` | Existing API (Local Boundary) |
| **StaffDashboardScreen** | Screen load / Refresh | Get Staff Home Portal Bundle | `GET` | `/api/v1/staff/me/dashboard` | Proposed Contract |
| **StaffDashboardScreen** | Swipe Right (Present) / Left (Leave) | Submit Daily Self-Attendance | `POST` | `/api/v1/attendance/self` | Existing API (Local Boundary) |
| **StaffDashboardScreen** | Tap "Mark Completed" on event | Mark Event Completed | `POST` | `/api/v1/events/{eventId}/complete` | Existing API (Local Boundary) |
| **StaffDashboardScreen** | Toggle task checkbox | Complete Daily Reminder Task | `POST` | `/api/v1/reminders/{reminderId}/complete` | Existing API (Local Boundary) |
| **StaffEventsScreen** | Filter Today/Upcoming/Done | Get Staff Assigned Events | `GET` | `/api/v1/staff/me/events` | Existing API (Local Boundary) |
| **StaffEventsScreen** | Modal submit completion notes | Mark Event Completed | `POST` | `/api/v1/events/{eventId}/complete` | Existing API (Local Boundary) |
| **StaffAttendanceScreen** | Screen load / Month navigate | Get Personal Monthly Attendance | `GET` | `/api/v1/staff/me/attendance` | Existing API (Local Boundary) |
| **StaffLeavesScreen** | Screen load / Tab filter | Get Personal Leave History | `GET` | `/api/v1/staff/me/leaves` | Existing API (Local Boundary) |
| **StaffLeavesScreen** | Submit leave modal | Apply For Leave | `POST` | `/api/v1/staff/me/leaves` | Existing API (Local Boundary) |
| **StaffRemindersScreen** | Screen load / Tab filter | Get Staff Reminders List | `GET` | `/api/v1/staff/me/reminders` | Existing API (Local Boundary) |
| **StaffRemindersScreen** | Tap complete checkbox | Complete Reminder Task | `POST` | `/api/v1/reminders/{reminderId}/complete` | Existing API (Local Boundary) |
| **StaffMoreScreen** | Screen load | Get Staff Profile Credentials | `GET` | `/api/v1/staff/me/profile` | Existing API (Local Boundary) |
| **StaffMoreScreen** | Tap Sign Out | Staff Sign Out | `POST` | `/api/v1/auth/logout` | Existing API (Local Boundary) |

---

## 3. Inventory Grouped by Feature Domain

```mermaid
graph LR
  subgraph AuthDomain[1. Auth & Profile]
    A1[/auth/login]
    A2[/auth/staff-login]
    A3[/auth/verify-token]
    A4[/auth/logout]
    A5[/admin/profile]
  end

  subgraph BookingDomain[2. Schedule & Bookings]
    B1[/dashboard/overview]
    B2[/schedule/bookings]
    B3[/bookings - CRUD]
    B4[/schedule/month-summary]
    B5[/schedule/validate-slot]
  end

  subgraph StaffDomain[3. Staff & Portal]
    C1[/staff - List & Create]
    C2[/staff/me/dashboard]
    C3[/staff/me/events]
    C4[/events/complete]
  end

  subgraph AttendanceDomain[4. Attendance & Leaves]
    D1[/attendance/daily]
    D2[/attendance/summary]
    D3[/attendance/record]
    D4[/attendance/self]
    D5[/leaves/admin - Decisions]
    D6[/staff/me/leaves - Apply]
  end
```

### Domain 1: Authentication & Authorization (5 Endpoints)
1. `POST /api/v1/auth/login` — Administrator authentication.
2. `POST /api/v1/auth/staff-login` — Priest & Assistant authentication.
3. `POST /api/v1/auth/forgot-password` — Password reset notification.
4. `GET /api/v1/auth/verify-token` — Validate stored JWT token.
5. `POST /api/v1/auth/logout` — Invalidate user session and token blacklist.

### Domain 2: Dashboard, Astrological Calendar & Panchangam (5 Endpoints)
6. `GET /api/v1/dashboard/overview` — Home dashboard 4-metric statistics.
7. `GET /api/v1/panchangam/today` — Daily Tithi, Nakshatram, Nalla Neram, Rahu Kalam.
8. `GET /api/v1/panchangam/details` — Complete 24-hour planetary hora, Gowri, and Kuligai.
9. `GET /api/v1/calendar/tamil-date-info` — Solar month, Tamil day, and year details.
10. `GET /api/v1/notifications/summary` — Header unread alerts and notification list.

### Domain 3: Schedule, Bookings & Event Operations (6 Endpoints)
11. `GET /api/v1/schedule/bookings` — Filterable event timeline for selected date.
12. `GET /api/v1/schedule/month-summary` — Month overview with booking counts and Muhurtham flags.
13. `GET /api/v1/bookings/today` — Today's events and currently active live ritual.
14. `POST /api/v1/bookings` — Create new event booking with client & priest payments.
15. `PUT /api/v1/bookings/{bookingId}` — Update existing event booking and fee reconciliation.
16. `POST /api/v1/schedule/validate-slot` — Check date/time collision before booking.

### Domain 4: Priest & Staff Directory (5 Endpoints)
17. `GET /api/v1/staff` — List all active priests and assistants with metrics.
18. `GET /api/v1/staff/dropdown` — Lightweight active staff list for modal dropdowns.
19. `GET /api/v1/staff/{staffId}/bookings` — Filtered bookings for a specific priest.
20. `POST /api/v1/staff` — Register a new priest or assistant.
21. `PUT /api/v1/staff/{staffId}` — Update priest designation, phone, or expertise.

### Domain 5: Attendance Governance (5 Endpoints)
22. `GET /api/v1/attendance/daily` — Date-wise attendance matrix across all active staff.
23. `GET /api/v1/attendance/summary` — Quick counts for date (Total, Present, Absent, Not Marked).
24. `PUT /api/v1/attendance/record` — Admin manual adjustment of a staff member's attendance.
25. `GET /api/v1/attendance/staff/{staffId}/monthly` — Monthly calendar attendance history for specific staff.
26. `POST /api/v1/attendance/self` — Staff portal daily swipe attendance submission.

### Domain 6: Leave Request Governance (4 Endpoints)
27. `GET /api/v1/leaves/admin/all` — Administrator review list for all staff leave requests.
28. `POST /api/v1/leaves/admin/{leaveId}/decision` — Administrator approval or rejection with audit reason.
29. `GET /api/v1/staff/me/leaves` — Personal leave request history for authenticated staff.
30. `POST /api/v1/staff/me/leaves` — Submit new leave request with date overlap validation.

### Domain 7: Staff Portal Personal Workspace (5 Endpoints)
31. `GET /api/v1/staff/me/dashboard` — Aggregated portal home bundle for priests/assistants.
32. `GET /api/v1/staff/me/events` — Assigned pooja rituals for authenticated staff member.
33. `POST /api/v1/events/{eventId}/complete` — Mark assigned ritual as completed.
34. `GET /api/v1/staff/me/reminders` — Daily preparation reminders and checklist tasks.
35. `POST /api/v1/reminders/{reminderId}/complete` — Mark task reminder completed.

### Domain 8: Institutional Administration & Peedam Profile (3 Endpoints)
36. `GET /api/v1/admin/profile` — Chief Administrator profile and Peedam information.
37. `PUT /api/v1/admin/profile` — Update Administrator phone, email, and sanctuary address.
38. `PUT /api/v1/settings/calendar-location` — Update reference city for Panchangam calculations.

---

## 4. Total Endpoint Summary

- **Total Backend APIs Identified:** 38 Endpoints
- **Core Critical Path (P0):** 16 Endpoints
- **Important Operational Path (P1):** 16 Endpoints
- **Enhancement & System Path (P2):** 6 Endpoints
