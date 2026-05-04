import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
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

    const invoice: Omit<Invoice, 'id'> = {
      studentId,
      month,
      year,
      sessionCount: presentCount,
      totalAmount,
      status: InvoiceStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), invoice);
    return docRef.id;
  },

  async getAll() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));

    if (invoices.length === 0) {
      const students = await studentService.getAll();
      if (students.length > 0) {
        const mockInvoice: Omit<Invoice, 'id'> = {
          studentId: students[0].id,
          month: 5,
          year: 2026,
          sessionCount: 8,
          totalAmount: 1200000,
          status: InvoiceStatus.PENDING,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, COLLECTION_NAME), mockInvoice);
        return this.getAll();
      }
    }
    return invoices;
  },

  async markAsPaid(invoiceId: string) {
    const docRef = doc(db, COLLECTION_NAME, invoiceId);
    await updateDoc(docRef, {
      status: InvoiceStatus.PAID,
      paidAt: new Date().toISOString()
    });
  },

  async update(id: string, data: Partial<Invoice>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
