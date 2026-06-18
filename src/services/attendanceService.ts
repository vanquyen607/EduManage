import { api } from '@/src/lib/api';
import { Attendance, AttendanceStatus } from '@/src/types';

export const attendanceService = {
  async getByMonth(studentId: string, month: number, year: number) {
    const data = await api.getAttendance({ studentId, month: String(month), year: String(year) });
    return data.map(mapAttendance);
  },
  async markAttendance(record: Omit<Attendance, 'id' | 'ownerId'>) {
    await api.markAttendance(record);
  }
};

function mapAttendance(d: any): Attendance {
  return {
    id: d.id,
    studentId: d.student_id,
    classId: d.class_id,
    date: d.date,
    status: d.status as AttendanceStatus || AttendanceStatus.PRESENT,
    ownerId: d.owner_id,
    month: d.month,
    year: d.year,
  };
}
