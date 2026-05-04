import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Attendance, AttendanceStatus } from '@/src/types';

const COLLECTION_NAME = 'attendance';

export const attendanceService = {
  async getByMonth(studentId: string, month: number, year: number) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('studentId', '==', studentId),
      where('month', '==', month),
      where('year', '==', year)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  },

  async markAttendance(record: Omit<Attendance, 'id'>) {
    // Check if exists
    const q = query(
      collection(db, COLLECTION_NAME),
      where('studentId', '==', record.studentId),
      where('date', '==', record.date)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return;

    await addDoc(collection(db, COLLECTION_NAME), record);
  }
};
