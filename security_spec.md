# Security Specification - English Center Management System

## Data Invariants
1. A Student must belong to a valid Class.
2. Attendance records must correspond to an existing Student and Class.
3. Invoices must be linked to a Student.
4. Comments must be linked to a Student.
5. All operations are restricted to the verified Admin (`vanquyen607@gmail.com`).

## The "Dirty Dozen" Payloads (Denial Tests)

### 1. Identity Spoofing (Unauthorized User)
**Action:** Create Student
**User:** `attacker@gmail.com`
**Payload:** `{ "name": "Fake Student", "classId": "class1", "parentPhone": "0123456789", "status": "active" }`
**Result:** `PERMISSION_DENIED`

### 2. ID Poisoning (Long ID)
**Action:** Create Student with 2KB ID
**User:** `vanquyen607@gmail.com`
**Path:** `/students/a_very_long_id_exceeding_128_characters...`
**Result:** `PERMISSION_DENIED`

### 3. Resource Exhaustion (Massive String)
**Action:** Create Student with 1MB name
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "name": "[1MB string...]", "classId": "class1", "parentPhone": "0123456789", "status": "active" }`
**Result:** `PERMISSION_DENIED`

### 4. Bypassing Validation (Missing Required Field)
**Action:** Create Student missing `parentPhone`
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "name": "Test", "classId": "class1", "status": "active" }`
**Result:** `PERMISSION_DENIED`

### 5. Type Poisoning (Invalid Type)
**Action:** Create Student with `name` as Number
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "name": 123, "classId": "class1", "parentPhone": "0123456789", "status": "active" }`
**Result:** `PERMISSION_DENIED`

### 6. Relational Sync (Orphaned Attendance)
**Action:** Create Attendance for non-existent Student
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "studentId": "non_existent", "date": "2024-05-04", "status": "present" }`
**Result:** `PERMISSION_DENIED`

### 7. Immutable Field Modification (Changing `studentId` on Invoice)
**Action:** Update Invoice `studentId`
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "studentId": "new_student_id" }`
**Result:** `PERMISSION_DENIED`

### 8. State Shortcut (Invalid Status)
**Action:** Create Student with status "graduated" (not in enum)
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "name": "Test", "classId": "class1", "parentPhone": "0123456789", "status": "graduated" }`
**Result:** `PERMISSION_DENIED`

### 9. Temporal Integrity (Client-side `createdAt`)
**Action:** Create Student with backdated `createdAt`
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "name": "Test", "classId": "class1", "parentPhone": "0123456789", "status": "active", "createdAt": "2020-01-01T00:00:00Z" }`
**Result:** `PERMISSION_DENIED`

### 10. Shadow Field Injection
**Action:** Create Student with extra hidden field `isAdmin: true`
**User:** `vanquyen607@gmail.com`
**Payload:** `{ "name": "Test", "classId": "class1", "parentPhone": "0123456789", "status": "active", "isAdmin": true }`
**Result:** `PERMISSION_DENIED`

### 11. Unauthorized List Query
**Action:** List Students
**User:** `unauthorized@gmail.com`
**Result:** `PERMISSION_DENIED`

### 12. PII Leak (Accessing Student Info as non-admin)
**Action:** Get Student by ID
**User:** `another_user@gmail.com`
**Result:** `PERMISSION_DENIED`
