export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  classId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: StudentStatus;
  ownerId: string;
  joinDate?: string;
  createdAt: string;
}

export interface ClassSchedule {
  dayOfWeek: number; // 0-6 (CN-T7)
  startTime: string;
  endTime: string;
  teacher?: string;
}

export interface Class {
  id: string;
  name: string;
  teacher?: string;
  feePerSession: number;
  description: string;
  color: string;
  ownerId: string;
  schedule?: ClassSchedule[];
}

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  score: number;
  weight: number; 
  date: string;
  ownerId: string;
  note?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  ownerId: string;
  month: number;
  year: number;
}

export interface Comment {
  id: string;
  studentId: string;
  month: number;
  year: number;
  content: string;
  rating: number;
  ownerId: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  month: number;
  year: number;
  sessionCount: number;
  totalAmount: number;
  status: InvoiceStatus;
  ownerId: string;
  paidAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  timeLabel: string;
  status: 'pending' | 'urgent' | 'done';
  type: 'clock' | 'alert' | 'check';
  ownerId: string;
  createdAt: string;
}
