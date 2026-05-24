import { z } from 'zod';

export const studentSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên quá dài'),
  birthDate: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['male', 'female', 'other']),
  classId: z.string().min(1, 'Vui lòng chọn lớp học'),
  parentName: z.string().min(2, 'Tên phụ huynh phải có ít nhất 2 ký tự').max(100),
  parentPhone: z.string().min(8, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
  parentEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export const classSchema = z.object({
  name: z.string().min(2, 'Tên lớp phải có ít nhất 2 ký tự').max(100),
  feePerSession: z.number().min(1000, 'Học phí tối thiểu 1,000đ').max(100000000, 'Học phí quá lớn'),
  description: z.string().optional().or(z.literal('')),
  color: z.string().min(1, 'Vui lòng chọn màu'),
});

export type ClassFormData = z.infer<typeof classSchema>;

export const authSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type AuthFormData = z.infer<typeof authSchema>;

export const registerSchema = authSchema.extend({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const gradeSchema = z.object({
  studentId: z.string().min(1, 'Vui lòng chọn học sinh'),
  subject: z.string().min(1, 'Vui lòng nhập môn học'),
  score: z.number().min(0, 'Điểm tối thiểu 0').max(10, 'Điểm tối đa 10'),
  weight: z.number().min(1).max(4),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
});

export type GradeFormData = z.infer<typeof gradeSchema>;

export const invoiceSchema = z.object({
  totalAmount: z.number().min(1000, 'Số tiền tối thiểu 1,000đ'),
  status: z.string().min(1),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const scheduleSchema = z.object({
  classId: z.string().min(1, 'Vui lòng chọn lớp học'),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
  endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
}).refine(data => data.startTime < data.endTime, {
  message: 'Giờ kết thúc phải sau giờ bắt đầu',
  path: ['endTime'],
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

export const notificationSchema = z.object({
  title: z.string().min(2, 'Nội dung phải có ít nhất 2 ký tự').max(200),
  timeLabel: z.string().min(1, 'Vui lòng nhập thời điểm'),
  status: z.string().min(1),
  type: z.string().min(1),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;

export const bankSettingsSchema = z.object({
  name: z.string().min(2, 'Tên ngân hàng phải có ít nhất 2 ký tự'),
  shortName: z.string().min(2, 'Mã định danh phải có ít nhất 2 ký tự'),
  accountNumber: z.string().min(6, 'Số tài khoản không hợp lệ').max(20),
  accountName: z.string().min(2, 'Tên chủ tài khoản phải có ít nhất 2 ký tự'),
});

export type BankSettingsFormData = z.infer<typeof bankSettingsSchema>;
