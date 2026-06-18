import { api } from '@/src/lib/api';
import { Invoice, InvoiceStatus, AttendanceStatus } from '@/src/types';
import { attendanceService } from './attendanceService';

export const billingService = {
  async getAll() {
    const data = await api.getInvoices();
    return data.map(mapInvoice);
  },
  async generateInvoice(studentId: string, month: number, year: number, feePerSession: number) {
    const attendance = await attendanceService.getByMonth(studentId, month, year);
    const presentCount = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    if (presentCount === 0) return null;
    const totalAmount = presentCount * feePerSession;
    const result = await api.addInvoice({
      studentId,
      month,
      year,
      sessionCount: presentCount,
      totalAmount,
    });
    return result.id;
  },
  async markAsPaid(invoiceId: string) {
    await api.updateInvoice(invoiceId, { status: InvoiceStatus.PAID, paidAt: new Date().toISOString() });
  },
  async update(id: string, data: Partial<Invoice>) {
    await api.updateInvoice(id, data);
  },
  async delete(id: string) {
    await api.deleteInvoice(id);
  }
};

function mapInvoice(d: any): Invoice {
  return {
    id: d.id,
    studentId: d.student_id,
    month: d.month,
    year: d.year,
    sessionCount: d.session_count || 0,
    totalAmount: d.total_amount || 0,
    status: d.status as InvoiceStatus || InvoiceStatus.PENDING,
    ownerId: d.owner_id,
    paidAt: d.paid_at || '',
    createdAt: d.created_at || '',
  };
}

export { mapInvoice };
