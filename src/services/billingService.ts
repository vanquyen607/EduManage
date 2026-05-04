import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { withOwner, addOwner } from '@/src/lib/firebaseUtils';
import { Invoice, InvoiceStatus, AttendanceStatus } from '@/src/types';
import { attendanceService } from './attendanceService';
import { studentService } from './studentService';
import { classService } from './classService';

const COLLECTION_NAME = 'invoices';

export const billingService = {
  async generateInvoice(studentId: string, month: number, year: number) {
    // Check for existing invoice first
    const existingInvoices = await this.getAll();
    const isDuplicate = existingInvoices.some(inv => 
      inv.studentId === studentId && 
      inv.month === month && 
      inv.year === year
    );

    if (isDuplicate) {
      console.warn(`Invoice already exists for student ${studentId} in ${month}/${year}`);
      return null;
    }

    const students = await studentService.getAll();
    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const classes = await classService.getAll();
    const cls = classes.find(c => c.id === student.classId);
    if (!cls) throw new Error('Class not found');

    const attendance = await attendanceService.getByMonth(studentId, month, year);
    const presentCount = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    
    const totalAmount = presentCount * cls.feePerSession;

    const invoice: Omit<Invoice, 'id' | 'ownerId'> = {
      studentId,
      month,
      year,
      sessionCount: presentCount,
      totalAmount,
      status: InvoiceStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), addOwner(invoice));
    return docRef.id;
  },

  async getAll() {
    const snapshot = await getDocs(withOwner(collection(db, COLLECTION_NAME)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  },

  async markAsPaid(invoiceId: string) {
    const docRef = doc(db, COLLECTION_NAME, invoiceId);
    await updateDoc(docRef, addOwner({
      status: InvoiceStatus.PAID,
      paidAt: new Date().toISOString()
    }));
  },

  async update(id: string, data: Partial<Invoice>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, addOwner(data));
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
