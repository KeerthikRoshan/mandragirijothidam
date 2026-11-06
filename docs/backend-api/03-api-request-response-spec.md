# Manthiragiri Jothidam — API Request & Response Specification

**Document Version:** 1.0.0  
**Project:** Manthiragiri Jothidam (மாந்திரகிரி ஜோதிடம்)  
**Target Audience:** Backend Engineering Team & Mobile Integration Engineers  
**Classification:** Technical Architecture Specification  

---

## 1. Global Standard Response Envelope

All API endpoints follow a unified response envelope convention to ensure predictable mobile client handling:

### 1.1. Success Envelope Pattern
```json
{
  "status": 1,
  "message": "Operation completed successfully.",
  "data": {},
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

### 1.2. Failure Envelope Pattern
```json
{
  "status": 0,
  "message": "Validation failed for the submitted fields.",
  "data": null,
  "errors": {
    "field_name": "Field-specific human-readable error in requested language."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 2. Authentication & Authorization Specifications

---

### 2.1. Admin Sign In (`POST /api/v1/auth/login`)
- **Purpose:** Authenticate the Chief Administrator using registered mobile number and password.
- **HTTP Method:** `POST`
- **Authentication:** None (Public)
- **Headers:** `Content-Type: application/json`, `Accept-Language: ta | en`

#### Request Schema
| Field | Data Type | Required | Validation | Description | Example |
|---|---|---|---|---|---|
| `countryCode` | String | Yes | Exact string `"+91"` | International dial code | `"+91"` |
| `mobileNumber` | String | Yes | `^[6-9]\d{9}$` | 10-digit Indian mobile number | `"9840123456"` |
| `password` | String | Yes | Min 6 characters | Admin account password | `"SacredPass@2026"` |

```json
{
  "countryCode": "+91",
  "mobileNumber": "9840123456",
  "password": "SacredPass@2026"
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "உள்நுழைவு வெற்றிகரமாக முடிந்தது (Sign in successful)",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin_token_sample",
    "refreshToken": "ref_admin_token_sample_abc123",
    "expiresAt": "2026-10-30T14:40:00.000Z",
    "user": {
      "id": "adm-sundaram",
      "role": "admin",
      "nameEnglish": "Sundaramoorthy Gurukkal",
      "nameTamil": "சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்",
      "title": "முதன்மை நிர்வாகி (Chief Administrator)",
      "phone": "+919840123456",
      "email": "mandhragiri.jothidam@gmail.com",
      "avatarUrl": "https://cdn.mandhragiri.com/avatars/sundaram.png"
    }
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

#### Error Responses
- **`400 Bad Request`**: Validation error (e.g. mobile does not match 10 digits).
```json
{
  "status": 0,
  "message": "சரியான 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும்.",
  "data": null,
  "errors": {
    "mobileNumber": "Enter a valid 10-digit Indian mobile number."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```
- **`401 Unauthorized`**: Invalid credentials.
```json
{
  "status": 0,
  "message": "மொபைல் எண் அல்லது கடவுச்சொல் தவறானது.",
  "data": null,
  "errors": {
    "credentials": "Invalid mobile number or password."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 2.2. Priest & Assistant Sign In (`POST /api/v1/auth/staff-login`)
- **Purpose:** Authenticate registered priests and assistants for the Staff Portal.
- **HTTP Method:** `POST`
- **Authentication:** None (Public)
- **Headers:** `Content-Type: application/json`, `Accept-Language: ta | en`

#### Request Schema
Same schema as Admin Login (`countryCode`, `mobileNumber`, `password`).

```json
{
  "countryCode": "+91",
  "mobileNumber": "9840123456",
  "password": "StaffVedic@123"
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "பணியாளர் தளம் உள்நுழைவு வெற்றிகரமாக முடிந்தது",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.staff_token_sample",
    "refreshToken": "ref_staff_token_sample_xyz789",
    "expiresAt": "2026-10-30T14:40:00.000Z",
    "user": {
      "id": "p-murugan",
      "staffId": "p-murugan",
      "role": "staff",
      "nameEnglish": "Murugan",
      "nameTamil": "முருகன்",
      "designationTamil": "தலைமை",
      "designationEnglish": "Chief Priest",
      "roleBadge": "SENIOR LEAD",
      "phone": "+919840123456",
      "traditionTamil": "வேத சைவ ஆகமம்",
      "certificationTamil": "அங்கீகரிக்கப்பட்ட கள குரு",
      "expertiseTamil": "ஹோமம் & கிரகப்பிரவேசம்",
      "languagesTamil": "தமிழ் & சமஸ்கிருதம்"
    }
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

#### Error Responses
- **`403 Forbidden`**: Inactive account.
```json
{
  "status": 0,
  "message": "தங்கள் பணியாளர் கணக்கு தற்போது முடக்கப்பட்டுள்ளது.",
  "data": null,
  "errors": {
    "account": "Staff account is currently inactive. Contact chief administrator."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 3. Dashboard & Astrological Panchangam

---

### 3.1. Get Dashboard Overview Metrics (`GET /api/v1/dashboard/overview`)
- **Purpose:** Supplies the 4-card statistics grid on the home dashboard.
- **HTTP Method:** `GET`
- **Authentication:** Admin Bearer Token
- **Headers:** `Authorization: Bearer <token>`

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Dashboard metrics retrieved successfully.",
  "data": {
    "dateKey": "2026-10-14",
    "todayEventsCount": 8,
    "upcomingSevenDaysCount": 24,
    "pendingApprovalCount": 5,
    "completedTotalCount": 142,
    "unreadNotificationsCount": 3
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 3.2. Get Today's Panchangam (`GET /api/v1/panchangam/today`)
- **Purpose:** Supplies the daily astrological details in the 2×2 Panchangam Card.
- **HTTP Method:** `GET`
- **Query Parameters:**
  - `location`: string (default: `"Madurai"`)
  - `date`: string (`YYYY-MM-DD`, optional, defaults to server current date)

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Today's Panchangam retrieved.",
  "data": {
    "dateKey": "2026-10-12",
    "gregorianBadge": "12 Oct 2026 •",
    "tamilDateBadge": "புரட்டாசி 26",
    "location": "Madurai",
    "tithi": {
      "titleTamil": "சுக்கில துவாதசி",
      "titleEnglish": "Dwadashi",
      "endTime": "பகல் 02:44 வரை"
    },
    "nakshatra": {
      "titleTamil": "உத்திரம்",
      "titleEnglish": "Uthiram",
      "endTime": "மாலை 04:12 வரை"
    },
    "nallaNeram": {
      "morning": "09:15 – 10:15",
      "evening": "04:45 – 05:45",
      "badge": "சுபம்"
    },
    "rahuKalam": {
      "time": "07:30 – 09:00",
      "period": "காலை வேளை",
      "badge": "விலக்குக"
    }
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 4. Schedule, Event & Pooja Booking Specifications

---

### 4.1. Get Schedule Bookings (`GET /api/v1/schedule/bookings`)
- **Purpose:** Populate timeline cards on `DailyScheduleScreen` for a selected calendar date.
- **HTTP Method:** `GET`
- **Query Parameters:**
  - `date`: string (mandatory, `YYYY-MM-DD`, e.g., `"2026-11-21"`)
  - `category`: string (optional, `"all" | "jathagam" | "temple" | "outdoor"`)
  - `viewMode`: string (optional, `"time" | "priest"`)

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Schedule bookings retrieved successfully.",
  "data": {
    "dateKey": "2026-11-21",
    "isMuhurtham": false,
    "isBlocked": false,
    "summary": {
      "total": 4,
      "confirmed": 2,
      "pending": 1,
      "upcoming": 1,
      "completed": 0
    },
    "categoryCounts": {
      "all": 4,
      "jathagam": 1,
      "temple": 1,
      "outdoor": 2
    },
    "bookings": [
      {
        "id": "b-nov21-1",
        "date": "2026-11-21",
        "timeSlot": "09:30 AM - 10:30 AM",
        "startTime": "09:30 AM",
        "endTime": "10:30 AM",
        "titleTamil": "ஜாதக கணிப்பு & பலன் பார்த்தல்",
        "titleEnglish": "Jathagam Consultation",
        "category": "jathagam",
        "categoryLabelTamil": "ஜாதகம்",
        "status": "confirmed",
        "statusLabelTamil": "உறுதி செய்யப்பட்டது",
        "clientName": "திரு. சுந்தரேசன் குடும்பத்தார்",
        "clientPhone": "+91 98421 55678",
        "locationTamil": "ஸ்ரீ மந்திரகிரி ஜோதிட பீடம்",
        "priestId": "p-sundaram",
        "priestNameTamil": "சுவாமி சுந்தரமூர்த்தி குருக்கள்",
        "priestPhone": "+91 94422 11001",
        "notesTamil": "திருமணப் பொருத்தம் & திசாபுத்தி பலன்கள் பார்த்தல்",
        "totalEventCharge": 1000,
        "clientTotalReceived": 1000,
        "clientBalanceAmount": 0,
        "priestTotalPay": 0,
        "priestAdvancePaid": 0,
        "priestBalanceAmount": 0
      },
      {
        "id": "b-nov21-2",
        "date": "2026-11-21",
        "timeSlot": "11:00 AM - 01:00 PM",
        "startTime": "11:00 AM",
        "endTime": "01:00 PM",
        "titleTamil": "திருமண முகூர்த்த பூஜை & சங்கல்பம்",
        "titleEnglish": "Temple Pooja & Sankalpam",
        "category": "temple",
        "categoryLabelTamil": "கோவில்",
        "status": "confirmed",
        "statusLabelTamil": "உறுதி செய்யப்பட்டது",
        "clientName": "மணமக்கள்: கார்த்திக் & தீபிகா",
        "clientPhone": "+91 94432 10987",
        "locationTamil": "ஸ்ரீ மங்களாம்பிகை சமேத கோவில்",
        "priestId": "p-murugan",
        "priestNameTamil": "சிவஸ்ரீ ராமலிங்க குருக்கள்",
        "priestPhone": "+91 94422 11002",
        "notesTamil": "மாங்கல்ய தாரண முகூர்த்த சங்கல்பம்",
        "totalEventCharge": 5000,
        "clientTotalReceived": 2000,
        "clientBalanceAmount": 3000,
        "priestTotalPay": 2500,
        "priestAdvancePaid": 1000,
        "priestBalanceAmount": 1500
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 4.2. Create Event / Pooja Booking (`POST /api/v1/bookings`)
- **Purpose:** Registers a new pooja, horoscope appointment, or outdoor ritual submitted via `PoojaBookingFormModal`.
- **HTTP Method:** `POST`
- **Authentication:** Admin Bearer Token
- **Headers:** `Content-Type: application/json`

#### Request Schema
| Field | Data Type | Required | Validation | Description | Example |
|---|---|---|---|---|---|
| `dateKey` | String | Yes | `^\d{4}-\d{2}-\d{2}$` | Event date | `"2026-10-28"` |
| `title` | String | Yes | Min 2 characters | Event title in Tamil | `"கணபதி ஹோமம் & சங்கல்ப பூஜை"` |
| `clientName` | String | Yes | Min 2 characters | Customer / devotee name | `"திரு. எஸ். கல்யாணசுந்தரம்"` |
| `phone` | String | Yes | `^\+?[0-9\s-]{10,15}$` | Client phone number | `"+91 98401 22334"` |
| `location` | String | Yes | Min 2 characters | Ritual location address | `"ஸ்ரீ மந்திரகிரி யாகசாலை"` |
| `category` | String | Yes | `"jathagam" \| "temple" \| "outdoor"` | Category code | `"temple"` |
| `categoryLabelTamil` | String | Yes | Non-empty | Category label in Tamil | `"கோவில்"` |
| `timeSlot` | String | Yes | Non-empty | Time slot string | `"09:00 AM - 10:30 AM"` |
| `priestId` | String | Yes | Valid ID or `"custom"` | Assigned priest ID | `"p-murugan"` |
| `priestName` | String | Yes | Non-empty | Assigned priest title | `"முருகன் சுவாமிகள் - தலைமை குருக்கள்"` |
| `priestPhone` | String | No | Phone format | Priest phone | `"+919840123456"` |
| `totalEventCharge` | Number | Yes | `>= 0` | Total fee billed to client | `5000` |
| `clientAdvanceAmount` | Number | Yes | `>= 0`, `<= totalEventCharge` | Advance paid by client | `1000` |
| `clientTotalReceived` | Number | Yes | `>= 0`, `<= totalEventCharge` | Total payments collected | `1000` |
| `priestTotalPay` | Number | Yes | `>= 0` | Compensation for priest | `2500` |
| `priestAdvancePaid` | Number | Yes | `>= 0`, `<= priestTotalPay` | Advance disbursed to priest | `500` |

```json
{
  "dateKey": "2026-10-28",
  "title": "கணபதி ஹோமம் & சங்கல்ப பூஜை",
  "clientName": "திரு. எஸ். கல்யாணசுந்தரம்",
  "phone": "+91 98401 22334",
  "location": "ஸ்ரீ மந்திரகிரி யாகசாலை",
  "category": "temple",
  "categoryLabelTamil": "கோவில்",
  "timeSlot": "09:00 AM - 10:30 AM",
  "priestId": "p-murugan",
  "priestName": "முருகன் சுவாமிகள் - தலைமை குருக்கள்",
  "priestPhone": "+919840123456",
  "totalEventCharge": 5000,
  "clientAdvanceAmount": 1000,
  "clientTotalReceived": 1000,
  "priestTotalPay": 2500,
  "priestAdvancePaid": 500
}
```

#### Success Response (`201 Created`)
```json
{
  "status": 1,
  "message": "பூஜை பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது (Booking registered successfully).",
  "data": {
    "id": "b-20261028-0900-murugan",
    "bookingNumber": "MJ-2026-10284",
    "dateKey": "2026-10-28",
    "titleTamil": "கணபதி ஹோமம் & சங்கல்ப பூஜை",
    "clientName": "திரு. எஸ். கல்யாணசுந்தரம்",
    "clientPhone": "+91 98401 22334",
    "locationTamil": "ஸ்ரீ மந்திரகிரி யாகசாலை",
    "category": "temple",
    "status": "confirmed",
    "statusLabelTamil": "உறுதி செய்யப்பட்டது",
    "timeSlot": "09:00 AM - 10:30 AM",
    "priestId": "p-murugan",
    "priestNameTamil": "முருகன் சுவாமிகள் - தலைமை குருக்கள்",
    "financials": {
      "totalEventCharge": 5000,
      "clientAdvanceAmount": 1000,
      "clientTotalReceived": 1000,
      "clientBalanceAmount": 4000,
      "priestTotalPay": 2500,
      "priestAdvancePaid": 500,
      "priestBalanceAmount": 2000
    },
    "createdAt": "2026-10-29T14:40:00.000Z",
    "createdBy": "adm-sundaram"
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

#### Error Responses
- **`409 Conflict`**: Time slot or priest collision.
```json
{
  "status": 0,
  "message": "தேர்ந்தெடுக்கப்பட்ட நேரத்தில் ஏற்கனவே மற்றொரு நிகழ்வு முன்பதிவு செய்யப்பட்டுள்ளது.",
  "data": null,
  "errors": {
    "collision": "Priest Murugan is already assigned to another event at 09:00 AM on 2026-10-28."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```
- **`422 Unprocessable Entity`**: Client advance exceeds total charge.
```json
{
  "status": 0,
  "message": "முன்பணம் மொத்த கட்டணத்தை விட அதிகமாக இருக்கக்கூடாது.",
  "data": null,
  "errors": {
    "clientAdvanceAmount": "Advance cannot exceed total event charge."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 5. Priest & Staff Management Specifications

---

### 5.1. Get Staff Directory (`GET /api/v1/staff`)
- **Purpose:** Supplies staff cards and metrics for `PriestScreen`.
- **HTTP Method:** `GET`
- **Query Parameters:**
  - `status`: string (optional, `"active" | "inactive" | "all"`, default: `"active"`)
  - `search`: string (optional, queries English/Tamil name, designation, expertise)

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Staff directory retrieved.",
  "data": {
    "totalCount": 5,
    "activeCount": 5,
    "staff": [
      {
        "id": "p-murugan",
        "nameEnglish": "Murugan",
        "nameTamil": "முருகன்",
        "designationTamil": "தலைமை",
        "designationEnglish": "Chief Priest",
        "roleBadge": "SENIOR LEAD",
        "fullTitleTamil": "முருகன் சுவாமிகள் - தலைமை குருக்கள்",
        "traditionTamil": "வேத சைவ ஆகமம்",
        "certificationTamil": "அங்கீகரிக்கப்பட்ட கள குரு",
        "phone": "+919840123456",
        "phoneDisplay": "+91 98401 XXXXX",
        "expertiseTamil": "ஹோமம் & கிரகப்பிரவேசம்",
        "languagesTamil": "தமிழ் & சமஸ்கிருதம்",
        "avatarUrl": "https://cdn.mandhragiri.com/avatars/murugan.png",
        "status": "active",
        "metrics": {
          "totalBookings": 48,
          "thisWeekBookings": 7,
          "conflictsCount": 0
        },
        "tabCounts": {
          "past": 38,
          "active": 1,
          "upcoming": 9
        }
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 5.2. Create New Priest / Assistant (`POST /api/v1/staff`)
- **Purpose:** Registers a new staff member submitted via `AddPriestModal`.
- **HTTP Method:** `POST`
- **Authentication:** Admin Bearer Token

#### Request Schema
```json
{
  "nameEnglish": "Venkatesan",
  "nameTamil": "வெங்கடேசன் குருக்கள்",
  "designationTamil": "புரோகிதர்",
  "designationEnglish": "Priest",
  "roleBadge": "OFFICIATING",
  "phone": "+919840998877",
  "expertiseTamil": "ஹோமம் & சிறப்பு பூஜை",
  "traditionTamil": "வேத சைவ ஆகமம்",
  "certificationTamil": "சான்றிதழ் பெற்ற குருக்கள்",
  "languagesTamil": "தமிழ் & சமஸ்கிருதம்"
}
```

#### Success Response (`201 Created`)
```json
{
  "status": 1,
  "message": "புரோகிதர் வெற்றிகரமாக சேர்க்கப்பட்டார்.",
  "data": {
    "id": "p-1730200800000",
    "nameEnglish": "Venkatesan",
    "nameTamil": "வெங்கடேசன் குருக்கள்",
    "designationTamil": "புரோகிதர்",
    "designationEnglish": "Priest",
    "roleBadge": "OFFICIATING",
    "phone": "+919840998877",
    "phoneDisplay": "+91 98409 XXXXX",
    "status": "active",
    "createdAt": "2026-10-29T14:40:00.000Z"
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 6. Attendance Governance Specifications

---

### 6.1. Get Daily Attendance Matrix (`GET /api/v1/attendance/daily`)
- **Purpose:** Populates `AttendanceManagementScreen` with attendance records for all active staff on a specified date.
- **HTTP Method:** `GET`
- **Query Parameters:**
  - `date`: string (mandatory, `YYYY-MM-DD`, e.g., `"2026-10-29"`)
  - `status`: string (optional, `"all" | "absent" | "present" | "not_marked"`)
  - `role`: string (optional, `"all" | "priest" | "assistant"`)
  - `search`: string (optional)

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Daily attendance retrieved.",
  "data": {
    "dateKey": "2026-10-29",
    "summary": {
      "totalStaff": 5,
      "presentCount": 4,
      "absentCount": 1,
      "notMarkedCount": 0
    },
    "records": [
      {
        "id": "p-murugan_2026-10-29",
        "staffId": "p-murugan",
        "staffNameEnglish": "Murugan",
        "staffNameTamil": "முருகன்",
        "designationTamil": "தலைமை குருக்கள்",
        "designationEnglish": "Chief Priest",
        "roleCategory": "priest",
        "status": "present",
        "submissionTime": "08:15 AM",
        "remarks": null,
        "updatedAt": "2026-10-29T02:45:00.000Z",
        "updatedBy": "Self (Staff Portal)"
      },
      {
        "id": "p-ramu_2026-10-29",
        "staffId": "p-ramu",
        "staffNameEnglish": "Ramu",
        "staffNameTamil": "ராமு சர்மா",
        "designationTamil": "உதவியாளர்",
        "designationEnglish": "Assistant",
        "roleCategory": "assistant",
        "status": "absent",
        "submissionTime": null,
        "remarks": "மருத்துவ விடுப்பு (Medical Leave)",
        "updatedAt": "2026-10-29T02:50:00.000Z",
        "updatedBy": "Self (Staff Portal)"
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 6.2. Admin Update Attendance Record (`PUT /api/v1/attendance/record`)
- **Purpose:** Allows administrators to modify or correct attendance status and remarks for a staff member on a date.
- **HTTP Method:** `PUT`
- **Authentication:** Admin Bearer Token

#### Request Schema
```json
{
  "staffId": "p-ramu",
  "dateKey": "2026-10-29",
  "status": "present",
  "submissionTime": "08:30 AM",
  "remarks": "நேரில் சரிபார்க்கப்பட்டு திருத்தப்பட்டது (Verified in person)"
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "வருகைப் பதிவு வெற்றிகரமாக திருத்தப்பட்டது.",
  "data": {
    "recordId": "p-ramu_2026-10-29",
    "staffId": "p-ramu",
    "dateKey": "2026-10-29",
    "status": "present",
    "submissionTime": "08:30 AM",
    "remarks": "நேரில் சரிபார்க்கப்பட்டு திருத்தப்பட்டது (Verified in person)",
    "updatedAt": "2026-10-29T14:40:00.000Z",
    "updatedBy": "சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)"
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 6.3. Staff Submit Daily Attendance (`POST /api/v1/attendance/self`)
- **Purpose:** Handles the swipe action (`Swipe Right = Present`, `Swipe Left = Absent`) on `StaffDashboardScreen`.
- **Enforcement:** **Strict Once-Per-Day Rule**. Tapping or swiping multiple times on the same date is blocked.
- **HTTP Method:** `POST`
- **Authentication:** Staff Bearer Token

#### Request Schema
```json
{
  "dateKey": "2026-10-29",
  "status": "present",
  "remarks": null
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "இன்றைய வருகை வெற்றிகரமாக பதிவானது (Attendance recorded).",
  "data": {
    "id": "p-murugan_2026-10-29",
    "staffId": "p-murugan",
    "dateKey": "2026-10-29",
    "status": "present",
    "submissionTime": "08:15 AM",
    "isSealed": true
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

#### Error Response (`409 Conflict - Already Submitted`)
```json
{
  "status": 0,
  "message": "இன்றைய வருகைப் பதிவு ஏற்கனவே முடிந்துள்ளது. மீண்டும் பதிவு செய்ய இயலாது.",
  "data": null,
  "errors": {
    "attendance": "Attendance has already been recorded for today (Strict Once-Per-Day Rule)."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 7. Leave Request Governance Specifications

---

### 7.1. Get All Staff Leave Requests (`GET /api/v1/leaves/admin/all`)
- **Purpose:** Supplies data for `AdminLeaveManagementScreen`.
- **HTTP Method:** `GET`
- **Query Parameters:** `status: "all" | "pending" | "approved" | "rejected"`

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Staff leave applications retrieved.",
  "data": {
    "counts": {
      "all": 4,
      "pending": 1,
      "approved": 2,
      "rejected": 1
    },
    "leaves": [
      {
        "id": "leave-ramu-1",
        "staffId": "p-ramu",
        "staffNameEnglish": "Ramu",
        "staffNameTamil": "ராமு சர்மா",
        "designationTamil": "உதவியாளர்",
        "startDate": "2026-11-03",
        "endDate": "2026-11-05",
        "totalDays": 3,
        "leaveType": "medical",
        "leaveTypeLabelTamil": "மருத்துவ விடுப்பு",
        "reason": "பல் மருத்துவ சிகிச்சை மற்றும் பரிசோதனை (Dental Surgery & Rest)",
        "status": "pending",
        "appliedAt": "2026-10-29"
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 7.2. Admin Decide Leave Request (`POST /api/v1/leaves/admin/{leaveId}/decision`)
- **Purpose:** Approve or reject a leave application with audit notes.
- **HTTP Method:** `POST`
- **Path Parameter:** `leaveId`

#### Request Schema
```json
{
  "decision": "approved",
  "adminRemarks": "அனுமதிக்கப்பட்டது (Approved). Have a restful recovery."
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "விடுப்பு விண்ணப்ப முடிவு பதிவு செய்யப்பட்டது.",
  "data": {
    "leaveId": "leave-ramu-1",
    "status": "approved",
    "decidedAt": "2026-10-29T14:40:00.000Z",
    "decidedBy": "சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள் (Chief Administrator)",
    "adminRemarks": "அனுமதிக்கப்பட்டது (Approved). Have a restful recovery."
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 7.3. Staff Apply For Leave (`POST /api/v1/staff/me/leaves`)
- **Purpose:** Allows staff to submit leave requests from `StaffLeavesScreen`.
- **HTTP Method:** `POST`
- **Authentication:** Staff Bearer Token

#### Request Schema
```json
{
  "startDate": "2026-11-10",
  "endDate": "2026-11-12",
  "leaveType": "personal",
  "reason": "குடும்ப விசேஷம் காரணமாக சொந்த ஊர் பயணம்."
}
```

#### Success Response (`201 Created`)
```json
{
  "status": 1,
  "message": "விடுப்பு விண்ணப்பம் நிர்வாகியின் ஒப்புதலுக்கு அனுப்பப்பட்டது.",
  "data": {
    "id": "leave-p-murugan-1730200000000",
    "staffId": "p-murugan",
    "startDate": "2026-11-10",
    "endDate": "2026-11-12",
    "totalDays": 3,
    "leaveType": "personal",
    "reason": "குடும்ப விசேஷம் காரணமாக சொந்த ஊர் பயணம்.",
    "status": "pending",
    "appliedAt": "2026-10-29"
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

#### Error Response (`409 Conflict - Overlapping Leave`)
```json
{
  "status": 0,
  "message": "குறிப்பிட்ட தேதிகளில் ஏற்கனவே மற்றொரு விடுப்பு விண்ணப்பம் பதிவில் உள்ளது.",
  "data": null,
  "errors": {
    "dateRange": "You already have an active leave request covering these dates."
  },
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 8. Staff Portal Operational Specifications

---

### 8.1. Get Staff Dashboard Home Bundle (`GET /api/v1/staff/me/dashboard`)
- **Purpose:** One-shot network call powering the entire `StaffDashboardScreen`.
- **HTTP Method:** `GET`
- **Authentication:** Staff Bearer Token

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Staff dashboard data retrieved.",
  "data": {
    "profile": {
      "id": "p-murugan",
      "nameTamil": "முருகன் சுவாமிகள்",
      "designationTamil": "தலைமை குருக்கள்",
      "traditionTamil": "வேத சைவ ஆகமம்"
    },
    "todayAttendance": {
      "isMarked": true,
      "status": "present",
      "submissionTime": "08:15 AM",
      "isSealed": true
    },
    "counts": {
      "todayCount": 1,
      "upcomingCount": 6,
      "pendingCompletionCount": 1
    },
    "todayEvents": [
      {
        "id": "ev-today-p-murugan",
        "date": "2026-10-29",
        "timeSlot": "09:00 AM - 10:30 AM",
        "titleTamil": "கணபதி ஹோமம் & சங்கல்ப பூஜை",
        "category": "temple",
        "categoryLabelTamil": "கோவில்",
        "clientName": "திரு. எஸ். கல்யாணசுந்தரம்",
        "clientPhone": "+91 98401 22334",
        "locationTamil": "ஸ்ரீ மந்திரகிரி யாகசாலை",
        "status": "confirmed"
      }
    ],
    "todayReminders": [
      {
        "id": "rem-td-1-p-murugan",
        "titleTamil": "பூஜை திரவியங்கள் & பொருட்கள் சரிபார்த்தல்",
        "descriptionTamil": "சமித்து, நெய், மலர்கள் தயார் நிலையை சரிபார்க்கவும்.",
        "time": "08:00 AM",
        "status": "pending"
      }
    ]
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 8.2. Staff Mark Event Completed (`POST /api/v1/events/{eventId}/complete`)
- **Purpose:** Marks an assigned ritual as completed from `StaffDashboardScreen` or `StaffEventsScreen`.
- **HTTP Method:** `POST`
- **Authentication:** Staff Bearer Token

#### Request Schema
```json
{
  "completionNotes": "பூர்ணாஹுதி மற்றும் பிரசாத விநியோகம் சிறப்புற நிறைவடைந்தது."
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "நிகழ்வு வெற்றிகரமாக முடிவுற்றதாக பதிவு செய்யப்பட்டது.",
  "data": {
    "eventId": "ev-today-p-murugan",
    "status": "completed",
    "statusLabelTamil": "முடிவுற்றது",
    "completedAt": "2026-10-29T14:40:00.000Z",
    "completedBy": "p-murugan",
    "completionNotes": "பூர்ணாஹுதி மற்றும் பிரசாத விநியோகம் சிறப்புற நிறைவடைந்தது."
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

## 9. Administrator Profile & Settings Specifications

---

### 9.1. Get Administrator Profile (`GET /api/v1/admin/profile`)
- **Purpose:** Supplies data for `ProfileScreen`.
- **HTTP Method:** `GET`
- **Authentication:** Admin Bearer Token

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "Profile retrieved.",
  "data": {
    "id": "adm-sundaram",
    "nameTamil": "சிவஸ்ரீ சுந்தரமூர்த்தி குருக்கள்",
    "titleTamil": "முதன்மை நிர்வாகி & தலைமை ஜோதிடர்",
    "phone": "+91 98401 23456",
    "email": "mandhragiri.jothidam@gmail.com",
    "addressTamil": "எண். 14, மீனாட்சி சுந்தரேஸ்வரர் சன்னதி தெரு, மதுரை - 625001",
    "metrics": {
      "yearsExperience": "32+ வருடங்கள்",
      "horoscopeCount": "12,500+",
      "homamCount": "4,800+",
      "accuracyRate": "100%"
    },
    "ashramDetails": {
      "peedamNameTamil": "ஸ்ரீ மந்திரகிரி ஜோதிட பீடம் & ஆன்மீக அறக்கட்டளை",
      "morningHours": "07:30 AM - 01:30 PM",
      "eveningHours": "04:30 PM - 08:30 PM"
    }
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```

---

### 9.2. Update Administrator Profile (`PUT /api/v1/admin/profile`)
- **Purpose:** Saves changes made in the Profile Edit Modal on `ProfileScreen`.
- **HTTP Method:** `PUT`
- **Authentication:** Admin Bearer Token

#### Request Schema
```json
{
  "phone": "+91 98401 23456",
  "email": "mandhragiri.jothidam@gmail.com",
  "addressTamil": "எண். 14, மீனாட்சி சுந்தரேஸ்வரர் சன்னதி தெரு, மதுரை - 625001"
}
```

#### Success Response (`200 OK`)
```json
{
  "status": 1,
  "message": "சுயவிவரம் வெற்றிகரமாக மாற்றப்பட்டது (Profile updated successfully).",
  "data": {
    "phone": "+91 98401 23456",
    "email": "mandhragiri.jothidam@gmail.com",
    "addressTamil": "எண். 14, மீனாட்சி சுந்தரேஸ்வரர் சன்னதி தெரு, மதுரை - 625001",
    "updatedAt": "2026-10-29T14:40:00.000Z"
  },
  "errors": null,
  "timestamp": "2026-10-29T14:40:00.000Z"
}
```
