# Wardian Backend API Specification

> Hospital Ward Management & Sepsis Prevention System

This document describes every entity, relationship, and API endpoint the Wardian frontend expects. Use it as the single source of truth when building the backend.

---

## Table of Contents

1. [Entities & Data Models](#1-entities--data-models)
2. [Entity Relationships (ERD)](#2-entity-relationships-erd)
3. [Authentication](#3-authentication)
4. [API Endpoints](#4-api-endpoints)
5. [Enums & Constants](#5-enums--constants)
6. [Business Rules](#6-business-rules)
7. [WebSocket Events (Future)](#7-websocket-events-future)

---

## 1. Entities & Data Models

### 1.1 `User` (Authenticated Staff)

| Field         | Type     | Required | Notes                          |
|---------------|----------|----------|--------------------------------|
| `id`          | UUID     | auto     | Primary key                    |
| `name`        | string   | yes      | Full name, e.g. "Dr. Elena Radu" |
| `email`       | string   | yes      | Unique, used for login         |
| `password`    | string   | yes      | Hashed, never returned in API  |
| `role`        | enum     | yes      | `doctor` \| `nurse`            |
| `hospitalId`  | UUID     | yes      | FK → Hospital                  |
| `employeeId`  | string   | yes      | Hospital-issued ID, e.g. "DOC-2024-001" |
| `createdAt`   | datetime | auto     |                                |

---

### 1.2 `Hospital`

| Field  | Type   | Required | Notes       |
|--------|--------|----------|-------------|
| `id`   | UUID   | auto     | Primary key |
| `name` | string | yes      | e.g. "Central University Hospital" |

---

### 1.3 `Floor`

| Field        | Type   | Required | Notes                        |
|--------------|--------|----------|------------------------------|
| `id`         | UUID   | auto     | Primary key                  |
| `hospitalId` | UUID   | yes      | FK → Hospital                |
| `name`       | string | yes      | e.g. "2nd Floor - Cardiology" |

---

### 1.4 `Ward`

| Field     | Type   | Required | Notes                  |
|-----------|--------|----------|------------------------|
| `id`      | UUID   | auto     | Primary key            |
| `floorId` | UUID   | yes      | FK → Floor             |
| `name`    | string | yes      | e.g. "Ward A"          |

---

### 1.5 `Bed`

| Field       | Type      | Required | Notes                          |
|-------------|-----------|----------|--------------------------------|
| `id`        | UUID      | auto     | Primary key                    |
| `wardId`    | UUID      | yes      | FK → Ward                      |
| `bedNumber` | string    | yes      | Display number, e.g. "01", "02" |
| `patientId` | UUID/null | no       | FK → Patient, null = empty bed |

---

### 1.6 `Patient`

This is the **core entity**. A patient can exist without a bed assignment (unassigned pool).

| Field                   | Type     | Required | Notes                                    |
|-------------------------|----------|----------|------------------------------------------|
| `id`                    | UUID     | auto     | Primary key                              |
| `name`                  | string   | yes      | Full name                                |
| `initials`              | string   | auto     | Derived from name, e.g. "AV"            |
| `age`                   | integer  | yes      |                                          |
| `gender`                | enum     | yes      | `M` \| `F`                              |
| `cnp`                   | string   | no       | National ID number (13 digits)           |
| `phoneNumber`           | string   | no       |                                          |
| `emergencyContactName`  | string   | no       |                                          |
| `emergencyContactPhone` | string   | no       |                                          |
| `bloodType`             | enum     | no       | See [Blood Types](#51-blood-types)       |
| `allergies`             | string   | no       | Free text, e.g. "Penicillin, Latex"      |
| `status`                | enum     | yes      | `stable` \| `warning` \| `critical`     |
| `sepsisRiskScore`       | integer  | yes      | 0–100, computed by AI model              |
| `aiInsight`             | string   | yes      | AI-generated clinical insight text       |
| `admissionDate`         | date     | yes      | ISO 8601 format                          |
| `diagnosis`             | string   | yes      | e.g. "Post-operative recovery - Hernia Repair" |
| `attendingPhysician`    | string   | yes      | Name of attending doctor                 |
| `performedSurgery`      | string   | no       | Most recent surgery name, if applicable  |
| `clinicalObservations`  | string   | no       | Free-text clinical notes                 |
| `createdAt`             | datetime | auto     |                                          |
| `updatedAt`             | datetime | auto     |                                          |

---

### 1.7 `Vitals`

Vital signs are **read frequently** and **written frequently** (real-time monitoring). Store as a time series.

| Field              | Type    | Required | Notes                           |
|--------------------|---------|----------|---------------------------------|
| `id`               | UUID    | auto     | Primary key                     |
| `patientId`        | UUID    | yes      | FK → Patient                    |
| `heartRate`        | integer | yes      | BPM                             |
| `temperature`      | float   | yes      | Celsius, one decimal (e.g. 36.8)|
| `bloodPressure`    | string  | yes      | Format: "120/80"                |
| `oxygenSaturation` | integer | yes      | SpO2 percentage (0–100)         |
| `respiratoryRate`  | integer | yes      | Breaths per minute              |
| `recordedAt`       | datetime| yes      | When this reading was taken     |

> **Frontend expects**: The API should return the **latest vitals** as a nested object on the Patient entity, plus a separate endpoint for vitals history (for charting).

**Vitals History Shape** (for time-series charts):

```json
{
  "heartRate":      [{ "time": "00:00", "value": 72 }, ...],
  "temperature":    [{ "time": "02:00", "value": 37.5 }, ...],
  "bloodPressure":  [{ "time": "04:00", "systolic": 120, "diastolic": 80 }, ...]
}
```

---

### 1.8 `HistoryEvent` (Medical History)

Each patient has a timeline of medical events.

| Field            | Type     | Required | Notes                                     |
|------------------|----------|----------|-------------------------------------------|
| `id`             | UUID     | auto     | Primary key                               |
| `patientId`      | UUID     | yes      | FK → Patient                              |
| `type`           | enum     | yes      | `surgery` \| `lab` \| `medication` \| `admission` \| `observation` |
| `title`          | string   | yes      | e.g. "Emergency Laparotomy"               |
| `description`    | string   | yes      | Summary text                              |
| `date`           | date     | yes      | ISO 8601                                  |
| `time`           | string   | yes      | "HH:mm" format                            |
| `details`        | string   | no       | Extended notes / clinical observations    |
| `surgeryType`    | string   | no       | Only for type=`surgery`, see [Surgery Options](#52-surgery-options) |
| `analysisResult` | string   | no       | AI analysis result text                   |
| `createdAt`      | datetime | auto     |                                           |

---

### 1.9 `Attachment` (Files on History Events)

| Field          | Type   | Required | Notes                           |
|----------------|--------|----------|---------------------------------|
| `id`           | UUID   | auto     | Primary key                     |
| `historyEventId` | UUID | yes      | FK → HistoryEvent               |
| `name`         | string | yes      | Original filename, e.g. "lab-results.pdf" |
| `url`          | string | yes      | Download URL (pre-signed or static) |
| `mimeType`     | string | no       | e.g. "application/pdf"          |
| `uploadedAt`   | datetime | auto   |                                 |

---

### 1.10 `Alert`

Real-time clinical alerts generated by the system or AI model.

| Field         | Type     | Required | Notes                                  |
|---------------|----------|----------|----------------------------------------|
| `id`          | UUID     | auto     | Primary key                            |
| `patientId`   | UUID     | yes      | FK → Patient                           |
| `patientName` | string   | yes      | Denormalized for fast display          |
| `bedNumber`   | string   | yes      | Denormalized for fast display          |
| `ward`        | string   | yes      | Denormalized ward name                 |
| `type`        | enum     | yes      | `critical` \| `warning` \| `info`      |
| `message`     | string   | yes      | Alert body text                        |
| `timestamp`   | datetime | yes      | When the alert was triggered           |
| `isRead`      | boolean  | yes      | Default: `false`                       |

---

### 1.11 `ClinicalReport`

Generated PDF reports stored for download history.

| Field         | Type     | Required | Notes                                  |
|---------------|----------|----------|----------------------------------------|
| `id`          | UUID     | auto     | Primary key                            |
| `generatedBy` | UUID     | yes      | FK → User                              |
| `label`       | string   | yes      | e.g. "Sepsis Alert Report", "Clinical Report" |
| `hasCritical` | boolean  | yes      | Whether critical alerts existed at generation time |
| `fileUrl`     | string   | yes      | Download URL for the PDF               |
| `generatedAt` | datetime | auto     |                                        |

---

## 2. Entity Relationships (ERD)

```
Hospital
  └── Floor (1:N)
        └── Ward (1:N)
              └── Bed (1:N)
                    └── Patient (0:1)  ← a bed has 0 or 1 patient

Patient (standalone entity, may or may not have a bed)
  ├── Vitals (1:N, time series)
  ├── HistoryEvent (1:N)
  │     └── Attachment (1:N)
  └── Alert (1:N)

User
  ├── belongs to Hospital (N:1)
  └── generates ClinicalReport (1:N)
```

**Key relationships:**

- A `Patient` can exist **without** a bed (unassigned patients pool).
- A `Bed` can be **empty** (`patientId = null`).
- One `Bed` holds at most **one** `Patient`.
- `Vitals` are a time series — the frontend needs both the **latest reading** and **historical data**.
- `HistoryEvent` entries can have zero or more `Attachment` files.
- `Alert` is associated with a `Patient` but also stores denormalized `patientName`, `bedNumber`, and `ward` for fast sidebar rendering.

---

## 3. Authentication

### 3.1 Register

```
POST /api/auth/register
```

**Request body:**

```json
{
  "name": "Dr. John Smith",
  "email": "doctor@hospital.com",
  "password": "securePassword123",
  "role": "doctor",
  "hospital": "Central University Hospital",
  "employeeId": "DOC-2024-001"
}
```

**Response:** `201 Created` with JWT token.

### 3.2 Login

```
POST /api/auth/login
```

**Request body:**

```json
{
  "email": "doctor@hospital.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK` with JWT token and user object.

### 3.3 Logout

```
POST /api/auth/logout
```

Invalidates the current session/token.

---

## 4. API Endpoints

### 4.1 Floors

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/floors`           | List all floors (with nested wards) |

**Response shape:**

```json
[
  {
    "id": "uuid",
    "name": "2nd Floor - Cardiology",
    "wards": [
      { "id": "uuid", "name": "Ward A" },
      { "id": "uuid", "name": "Ward B" }
    ]
  }
]
```

### 4.2 Wards

| Method | Endpoint                          | Description             |
|--------|-----------------------------------|-------------------------|
| POST   | `/api/floors/:floorId/wards`      | Create a ward           |
| DELETE | `/api/floors/:floorId/wards/:wardId` | Delete a ward (moves patients to unassigned) |

### 4.3 Beds

| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| GET    | `/api/wards/:wardId/beds`       | List beds in a ward (with patient summary) |
| POST   | `/api/wards/:wardId/beds`       | Add an empty bed        |
| DELETE | `/api/beds/:bedId`              | Delete a bed (moves patient to unassigned if occupied) |

### 4.4 Patients

| Method | Endpoint                              | Description                       |
|--------|---------------------------------------|-----------------------------------|
| GET    | `/api/patients`                       | List all patients (supports `?search=name` query) |
| GET    | `/api/patients/unassigned`            | List patients not assigned to any bed |
| GET    | `/api/patients/:patientId`            | Full patient detail (with latest vitals, history) |
| POST   | `/api/patients`                       | Create a new patient (unassigned) |
| POST   | `/api/patients?bedId=:bedId`          | Create and assign to a bed        |
| PATCH  | `/api/patients/:patientId`            | Update patient fields             |
| DELETE | `/api/patients/:patientId`            | Remove patient from system        |

### 4.5 Bed ↔ Patient Assignment

| Method | Endpoint                              | Description                       |
|--------|---------------------------------------|-----------------------------------|
| POST   | `/api/beds/:bedId/assign`             | Assign an unassigned patient to a bed |
| POST   | `/api/beds/:bedId/unassign`           | Unassign patient (moves to unassigned pool) |

**Assign request body:**

```json
{
  "patientId": "uuid"
}
```

### 4.6 Vitals

| Method | Endpoint                                | Description                       |
|--------|-----------------------------------------|-----------------------------------|
| GET    | `/api/patients/:patientId/vitals/latest`| Latest vital signs reading        |
| GET    | `/api/patients/:patientId/vitals/history` | Time-series data for charts (query: `?hours=24`) |
| POST   | `/api/patients/:patientId/vitals`      | Record a new vitals reading       |

**Latest vitals response:**

```json
{
  "heartRate": 72,
  "temperature": 36.8,
  "bloodPressure": "120/80",
  "oxygenSaturation": 98,
  "respiratoryRate": 16,
  "recordedAt": "2024-03-30T14:00:00Z"
}
```

### 4.7 Medical History

| Method | Endpoint                                         | Description                  |
|--------|--------------------------------------------------|------------------------------|
| GET    | `/api/patients/:patientId/history`               | List all history events (newest first) |
| POST   | `/api/patients/:patientId/history`               | Create a new history event   |

**Create history event request:**

```json
{
  "type": "surgery",
  "title": "Emergency Laparotomy",
  "description": "Appendectomy with peritoneal lavage",
  "date": "2024-03-29",
  "time": "04:30",
  "details": "Clinical observation notes here...",
  "surgeryType": "Appendectomy"
}
```

### 4.8 Attachments (File Upload)

| Method | Endpoint                                               | Description                 |
|--------|--------------------------------------------------------|-----------------------------|
| POST   | `/api/patients/:patientId/history/:eventId/attachments`| Upload file(s) to a history event |
| GET    | `/api/attachments/:attachmentId/download`              | Download/stream a file      |

**Upload:** `multipart/form-data` with file field(s).

**Response:**

```json
{
  "id": "uuid",
  "name": "lab-results.pdf",
  "url": "/api/attachments/uuid/download",
  "mimeType": "application/pdf"
}
```

### 4.9 Alerts

| Method | Endpoint                          | Description                       |
|--------|-----------------------------------|-----------------------------------|
| GET    | `/api/alerts`                     | List all alerts (newest first, supports `?unreadOnly=true`) |
| PATCH  | `/api/alerts/:alertId/read`       | Mark an alert as read             |

### 4.10 Clinical Reports

| Method | Endpoint                          | Description                       |
|--------|-----------------------------------|-----------------------------------|
| POST   | `/api/reports/generate`           | Generate a clinical PDF report    |
| GET    | `/api/reports`                    | List past generated reports       |
| GET    | `/api/reports/:reportId/download` | Download a report PDF             |
| DELETE | `/api/reports/:reportId`          | Delete a report                   |

**Generate response:**

```json
{
  "id": "uuid",
  "label": "Sepsis Alert Report",
  "hasCritical": true,
  "fileUrl": "/api/reports/uuid/download",
  "generatedAt": "2024-03-30T14:30:00Z"
}
```

### 4.11 AI / Sepsis Analysis

| Method | Endpoint                                    | Description                       |
|--------|---------------------------------------------|-----------------------------------|
| POST   | `/api/patients/:patientId/analyze`          | Trigger AI sepsis risk analysis   |

**Response:**

```json
{
  "sepsisRiskScore": 87,
  "aiInsight": "CRITICAL: High sepsis risk due to persistent tachycardia...",
  "status": "critical",
  "analysisResult": "Detailed analysis text saved to history..."
}
```

> This endpoint should also create a `HistoryEvent` of type `observation` with the analysis result.

---

## 5. Enums & Constants

### 5.1 Blood Types

```
A+, A-, B+, B-, AB+, AB-, O+, O-
```

### 5.2 Surgery Options

```
Laparoscopic Cholecystectomy, Coronary Artery Bypass Grafting,
Hip Replacement, Knee Replacement, Appendectomy, Cesarean Section,
Spinal Fusion, Hernia Repair, Colectomy, Mastectomy, Thyroidectomy,
Gastric Bypass, Carotid Endarterectomy, Aortic Valve Replacement,
Nephrectomy, Prostatectomy, Craniotomy, Laminectomy,
Rotator Cuff Repair, ACL Reconstruction, Hysterectomy, Lobectomy
```

### 5.3 Patient Status

```
stable, warning, critical
```

### 5.4 Alert Type

```
critical, warning, info
```

### 5.5 History Event Type

```
surgery, lab, medication, admission, observation
```

### 5.6 User Role

```
doctor, nurse
```

### 5.7 Hospitals (Seed Data)

```
Central University Hospital, St. Mary Medical Center,
Regional General Hospital, Metropolitan Health System,
Community Memorial Hospital
```

---

## 6. Business Rules

1. **Bed assignment is exclusive**: one bed holds at most one patient.
2. **Patients can be unassigned**: they exist in a pool and can be assigned to any empty bed.
3. **Deleting a ward** moves all its patients to the unassigned pool; it does not delete patients.
4. **Deleting a bed** with a patient moves that patient to the unassigned pool.
5. **Sepsis risk score** is computed by the AI model (0–100). Thresholds:
   - `< 30` → `stable` (green)
   - `30–69` → `warning` (orange)
   - `≥ 70` → `critical` (red)
6. **Alerts** are generated automatically by the system when vitals cross thresholds or AI analysis detects risk.
7. **Clinical reports** are generated on demand and saved for history. The PDF includes all current alerts and a patient summary table.
8. **Initials** are auto-derived from the patient's name (first letter of each word, max 2 chars).
9. **Vitals** should include the latest snapshot on the Patient object and a time-series history endpoint for charts.
10. **File attachments** (lab results, PDFs) are uploaded to history events and must be downloadable.

---

## 7. WebSocket Events (Future)

For real-time updates, the frontend would benefit from WebSocket push for:

| Event                  | Payload                                  | Trigger                          |
|------------------------|------------------------------------------|----------------------------------|
| `vitals:updated`       | `{ patientId, vitals }`                  | New vitals reading recorded      |
| `alert:created`        | Full `Alert` object                      | New alert generated              |
| `alert:read`           | `{ alertId }`                            | Alert marked as read             |
| `patient:updated`      | `{ patientId, changes }`                 | Patient data modified            |
| `bed:assigned`         | `{ bedId, patientId }`                   | Patient assigned to bed          |
| `bed:unassigned`       | `{ bedId, patientId }`                   | Patient removed from bed         |
| `sepsisRisk:changed`   | `{ patientId, oldScore, newScore, status }` | AI recalculation completed   |

---

## Quick Reference: Full Patient Object (as returned by GET /api/patients/:id)

```json
{
  "id": "uuid",
  "name": "Ion Popescu",
  "initials": "IP",
  "age": 62,
  "gender": "M",
  "cnp": "1620815234567",
  "phoneNumber": "0762 890 123",
  "emergencyContactName": "Ana Popescu",
  "emergencyContactPhone": "0723 444 555",
  "bloodType": "B+",
  "allergies": "Sulfonamides, Latex",
  "status": "critical",
  "sepsisRiskScore": 87,
  "aiInsight": "CRITICAL: High sepsis risk...",
  "admissionDate": "2024-03-29",
  "diagnosis": "Perforated Appendix - Post Emergency Laparotomy",
  "attendingPhysician": "Dr. Maria Constantinescu",
  "performedSurgery": "Appendectomy",
  "clinicalObservations": "Patient showing signs of...",
  "bedNumber": "04",
  "vitals": {
    "heartRate": 112,
    "temperature": 38.9,
    "bloodPressure": "95/60",
    "oxygenSaturation": 92,
    "respiratoryRate": 24,
    "recordedAt": "2024-03-30T14:00:00Z"
  },
  "medicalHistory": [
    {
      "id": "uuid",
      "type": "surgery",
      "title": "Emergency Laparotomy",
      "description": "Appendectomy with peritoneal lavage",
      "date": "2024-03-29",
      "time": "04:30",
      "details": "Extended notes...",
      "surgeryType": "Appendectomy",
      "analysisResult": null,
      "attachments": [
        {
          "id": "uuid",
          "name": "post-op-labs.pdf",
          "url": "/api/attachments/uuid/download"
        }
      ]
    }
  ]
}
```
