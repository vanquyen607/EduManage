import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { withOwner, addOwner } from '@/src/lib/firebaseUtils';
import { Attendance, AttendanceStatus } from '@/src/types';

const COLLECTION_NAME = 'attendance';

export const attendanceService = {
  async getByMonth(studentId: string, month: number, year: number) {
    const q = query(
      withOwner(collection(db, COLLECTION_NAME)),
      where('studentId', '==', studentId),
      where('month', '==', month),
      where('year', '==', year)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  },

  async markAttendance(record: Omit<Attendance, 'id' | 'ownerId'>) {
    // Check if exists
    const q = query(
      withOwner(collection(db, COLLECTION_NAME)),
      where('studentId', '==', record.studentId),
      where('date', '==', record.date)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await updateDoc(doc(db, COLLECTION_NAME, docId), addOwner(record));
      return;
    }

    await addDoc(collection(db, COLLECTION_NAME), addOwner(record));
  }
};
