import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Download,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  QrCode,
  X,
  Copy,
  Settings,
  FileText
} from 'lucide-react';
import { billingService } from '@/src/services/billingService';
import { studentService } from '@/src/services/studentService';
import { classService } from '@/src/services/classService';
import { Invoice, Class, Student, InvoiceStatus, StudentStatus } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';
import Modal from '@/src/components/ui/Modal';
import { getPaymentQRUrl } from '@/src/lib/bankConfig';
import { settingsService, BankSettings } from '@/src/services/settingsService';
import BankSettingsForm from './BankSettingsForm';
import Pagination, { usePagination } from '@/src/components/ui/Pagination';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import { exportToExcel } from '@/src/lib/exportUtils';
import { buildInvoiceRows, exportInvoicesPDF } from '@/src/lib/invoiceExport';
import { useToast } from '@/src/lib/toast';

function slugName(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-');
}

export default function InvoiceList() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classList, setClassList] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<InvoiceStatus>(InvoiceStatus.PENDING);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [expMonth, setExpMonth] = useState<'all' | number>('all');
  const [expYear, setExpYear] = useState<number>(new Date().getFullYear());
  const [expStudent, setExpStudent] = useState<'all' | string>('all');
  const [expStatus, setExpStatus] = useState<'all' | InvoiceStatus>('all');
  const [expFormat, setExpFormat] = useState<'pdf' | 'excel'>('pdf');

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState<number>(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination<Invoice>(invoices, 8);

  useEffect(() => {
    fetchData();
    loadBankSettings();
  }, []);

  const loadBankSettings = async () => {
    try {
      const data = await settingsService.getBankSettings();
      setBankSettings(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [iData, sData, cData] = await Promise.all([
        billingService.getAll(),
        studentService.getAll(),
        classService.getAll()
      ]);
      setInvoices(iData);
      setStudents(sData);
      setClassList(cData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setInvoiceToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await billingService.delete(invoiceToDelete);
      toast('Đã xóa hóa đơn!', 'success');
      setIsConfirmDeleteOpen(false);
      setInvoiceToDelete(null);
      fetchData();
    } catch (err) {
      toast('Có lỗi khi xóa hóa đơn!', 'error');
    }
  };

  const handleEditClick = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setEditAmount(invoice.totalAmount);
    setEditStatus(invoice.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    if (editAmount < 0 || Number.isNaN(editAmount)) {
      toast('Số tiền không hợp lệ!', 'error');
      return;
    }
    try {
      await billingService.update(selectedInvoice.id, {
        totalAmount: editAmount,
        status: editStatus
      });
      toast('Cập nhật hóa đơn thành công!', 'success');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      toast('Có lỗi khi cập nhật hóa đơn!', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast('Đã sao chép vào clipboard!', 'success'))
      .catch(() => toast('Không thể sao chép!', 'error'));
  };

  const availablePeriods = React.useMemo(() => {
    const map = new Map<string, { month: number; year: number }>();
    invoices.forEach(i => map.set(`${i.year}-${i.month}`, { month: i.month, year: i.year }));
    return Array.from(map.values()).sort((a, b) => b.year - a.year || b.month - a.month);
  }, [invoices]);

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    const set = new Set<number>([current - 1, current, current + 1]);
    invoices.forEach(i => set.add(i.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [invoices]);

  React.useEffect(() => {
    if (expMonth !== 'all' && !availablePeriods.some(p => p.year === expYear && p.month === expMonth)) {
      const fallback = availablePeriods[0];
      if (fallback) setExpYear(fallback.year);
    }
  }, [availablePeriods, expMonth, expYear]);

  const filteredExportInvoices = React.useMemo(() => invoices.filter(inv => {
    if (expMonth !== 'all' && (inv.month !== expMonth || inv.year !== expYear)) return false;
    if (expStudent !== 'all' && inv.studentId !== expStudent) return false;
    if (expStatus !== 'all' && inv.status !== expStatus) return false;
    return true;
  }), [invoices, expMonth, expYear, expStudent, expStatus]);

  const exportDescription = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(expMonth === 'all' ? 'Tất cả các kỳ' : `Kỳ: Tháng ${expMonth}/${expYear}`);
    if (expStudent !== 'all') {
      parts.push(`Học viên: ${students.find(s => s.id === expStudent)?.name || ''}`);
    }
    if (expStatus !== 'all') parts.push(expStatus === InvoiceStatus.PAID ? 'Đã đóng' : 'Chờ thu');
    return parts.join(' · ');
  }, [expMonth, expYear, expStudent, expStatus, students]);

  const handleExport = () => {
    if (filteredExportInvoices.length === 0) {
      toast('Không có hóa đơn nào khớp bộ lọc!', 'warning');
      return;
    }
    try {
      if (expFormat === 'pdf') {
        exportInvoicesPDF(filteredExportInvoices, {
          students,
          classes: classList,
          description: exportDescription,
        });
      } else {
        const rows = buildInvoiceRows(filteredExportInvoices, { students, classes: classList });
        const suffix = [
          expMonth !== 'all' ? `thang-${expMonth}-${expYear}` : '',
          expStudent !== 'all' ? slugName(students.find(s => s.id === expStudent)?.name || 'hoc-vien') : '',
        ].filter(Boolean).join('-');
        exportToExcel(rows, `hoa-don-hoc-phi${suffix ? '-' + suffix : ''}`);
      }
      toast(`Đã xuất ${filteredExportInvoices.length} hóa đơn (${expFormat.toUpperCase()})!`, 'success');
      setIsExportOpen(false);
    } catch (err) {
      toast('Có lỗi khi xuất hóa đơn!', 'error');
    }
  };

  const openGenerateModal = () => {
    setGenMonth(new Date().getMonth() + 1);
    setGenYear(new Date().getFullYear());
    setIsGenerateOpen(true);
  };

  const handleGenerateMonthly = async () => {
    setIsGenerating(true);
    try {
      const res = await billingService.generateMonthlyInvoices(genMonth, genYear);
      let msg = `Tháng ${genMonth}/${genYear}: `;
      if (res.created > 0) msg += `đã tạo ${res.created} hóa đơn. `;
      if (res.noAttendance > 0) msg += `${res.noAttendance} học viên chưa có buổi học. `;
      if (res.skipped > 0) msg += `${res.skipped} học viên bỏ qua (đã có HĐ hoặc chưa có học phí).`;
      if (res.created === 0 && res.noAttendance === 0 && res.skipped === 0) msg += 'không có học viên nào.';
      toast(msg.trim(), res.created > 0 ? 'success' : 'info');
      setIsGenerateOpen(false);
    } catch (err) {
      toast('Có lỗi khi tạo hóa đơn!', 'error');
    } finally {
      await fetchData();
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Tài chính & Học phí</p>
          </div>
          <h2 className="text-4xl  font-bold text-ink tracking-tight">Quản lý Học phí</h2>
          <p className="text-muted text-sm mt-1">Theo dõi doanh thu, trạng thái thanh toán và xuất hóa đơn.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={async () => {
              await fetchData();
              setIsExportOpen(true);
            }}
            className="px-6 py-3 rounded-xl transition-all border bg-card text-muted border-hairline hover:border-slate-800 shadow-sm flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
          >
            <Download size={14} />
            Xuất hóa đơn
          </button>
          <button 
            type="button"
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) loadBankSettings();
            }}
            className={cn(
              "px-6 py-3 rounded-xl transition-all border flex items-center gap-2 text-[10px] font-black tracking-widest uppercase",
              showSettings ? "bg-coral text-white border-coral shadow-lg" : "bg-card text-muted border-hairline hover:border-ink shadow-sm"
            )}
          >
            <Settings size={14} />
            Cài đặt bank
          </button>
          <button 
            type="button"
            onClick={openGenerateModal}
            className="bg-coral text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-coral/20 hover:bg-coral-active transition-all active:scale-95"
          >
            <ArrowRight size={14} />
            Tạo hóa đơn
          </button>
        </div>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden mb-8"
        >
          <BankSettingsForm />
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'CHỜ THANH TOÁN', value: `${invoices.filter(i => i.status === InvoiceStatus.PENDING).length} hóa đơn`, color: 'bg-accent-amber' },
          { label: 'ĐÃ HOÀN THÀNH', value: `${invoices.filter(i => i.status === InvoiceStatus.PAID).length} hóa đơn`, color: 'bg-accent-teal' },
          { label: 'TỔNG CỘNG', value: formatCurrency(invoices.reduce((acc, i) => acc + i.totalAmount, 0)), color: 'bg-coral' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-8 rounded-xl border border-hairline shadow-sm relative overflow-hidden group"
          >
             <div className={cn("absolute -top-4 -right-4 w-20 h-20 opacity-5 rounded-full blur-xl transition-transform duration-500 group-hover:scale-150", stat.color)} />
             <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
             <p className="text-3xl  font-bold text-ink">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-hairline overflow-hidden shadow-sm">
        <div className="md:hidden divide-y divide-hairline">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-6 animate-pulse space-y-3">
                <div className="h-4 bg-hairline/50 rounded w-1/2" />
                <div className="h-4 bg-accent-light rounded w-full" />
              </div>
            ))
          ) : invoices.map((invoice, idx) => {
            const student = students.find(s => s.id === invoice.studentId);
            return (
              <div key={invoice.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-hairline/50 flex items-center justify-center font-bold text-muted">
                      {student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-ink">{student?.name || 'N/A'}</p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Tháng {invoice.month}/{invoice.year}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                    invoice.status === InvoiceStatus.PAID ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                  )}>
                    {invoice.status === InvoiceStatus.PAID ? 'ĐÃ ĐÓNG' : 'CHỜ THU'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg  font-black text-ink">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="text-[10px] text-muted uppercase tracking-tighter italic">{invoice.sessionCount} buổi thực tế</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => handleEditClick(e, invoice)} className="p-2.5 bg-accent-light text-muted rounded-xl"><Edit2 size={16} /></button>
                    <button onClick={(e) => handleDelete(invoice.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16} /></button>
                    {invoice.status === InvoiceStatus.PENDING && (
                      <button onClick={(e) => handlePayment(e, invoice)} className="p-2.5 bg-slate-900 text-white rounded-xl"><QrCode size={16} /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-accent-light/50 border-b border-hairline">
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Học sinh</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Thời gian</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Số tiền</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(4)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-8"><div className="h-4 bg-hairline/50 rounded w-full" /></td>
                  </tr>
                ))
              ) : invoices.length > 0 ? (
                paginatedItems.map((invoice, idx) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={invoice.id}
                    className="hover:bg-accent-light/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-hairline/50 flex items-center justify-center font-bold text-muted">
                          {students.find(s => s.id === invoice.studentId)?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-ink">
                            {students.find(s => s.id === invoice.studentId)?.name || 'N/A'}
                          </p>
                          <p className="text-[10px] font-mono text-muted uppercase tracking-tighter">ID: {invoice.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest">Tháng {invoice.month}/{invoice.year}</p>
                      <p className="text-[10px] text-muted mt-0.5 uppercase tracking-tighter italic">{invoice.sessionCount} buổi thực tế</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className=" text-lg font-bold text-ink">{formatCurrency(invoice.totalAmount)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        invoice.status === InvoiceStatus.PAID ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", invoice.status === InvoiceStatus.PAID ? "bg-emerald-500" : "bg-amber-500")} />
                        {invoice.status === InvoiceStatus.PAID ? 'ĐÃ ĐÓNG' : 'CHỜ THU'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button type="button" onClick={(e) => handleEditClick(e, invoice)} className="p-2.5 text-muted hover:text-coral hover:bg-card rounded-xl shadow-sm border border-transparent hover:border-hairline transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id); }} className="p-2.5 text-muted hover:text-red-500 hover:bg-card rounded-xl shadow-sm border border-transparent hover:border-hairline transition-all">
                          <Trash2 size={16} />
                        </button>
                        {invoice.status === InvoiceStatus.PENDING && (
                          <button type="button" onClick={(e) => handlePayment(e, invoice)} className="ml-2 px-4 py-2 bg-coral text-white rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-md active:scale-95 transition-all">
                            THANH TOÁN
                            <QrCode size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-[11px] font-black text-muted uppercase tracking-widest">Không có hóa đơn khả dụng</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!isLoading && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </div>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Thông tin Thanh toán">
        {selectedInvoice && bankSettings && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-accent-light p-4 rounded-xl border border-hairline flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-muted uppercase mb-1">Mã hóa đơn</p>
                  <p className="text-xs font-mono font-bold text-body">#{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-muted uppercase mb-1">Số tiền</p>
                  <p className="text-base md:text-lg font-black text-coral">{formatCurrency(selectedInvoice.totalAmount)}</p>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
               <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted mb-1 block">Ngân hàng</label>
                    <div className="bg-white border border-hairline p-2.5 rounded-lg flex items-center justify-between group">
                       <span className="text-xs md:text-sm font-semibold">{bankSettings.name}</span>
                       <button onClick={() => copyToClipboard(bankSettings.name)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-coral transition-all">
                          <Copy size={12} />
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted mb-1 block">Số tài khoản</label>
                    <div className="bg-white border border-hairline p-2.5 rounded-lg flex items-center justify-between group">
                       <span className="text-xs md:text-sm font-mono font-bold text-coral">{bankSettings.accountNumber}</span>
                       <button onClick={() => copyToClipboard(bankSettings.accountNumber)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-coral transition-all">
                          <Copy size={12} />
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted mb-1 block">Chủ tài khoản</label>
                    <div className="bg-white border border-hairline p-2.5 rounded-lg">
                       <span className="text-xs md:text-sm font-bold uppercase">{bankSettings.accountName}</span>
                    </div>
                  </div>
               </div>

               <div className="w-full md:w-44 flex flex-col items-center gap-2">
                  <div className="bg-white p-1.5 border-2 border-primary rounded-xl shadow-lg w-32 md:w-full">
                     <img 
                       src={getPaymentQRUrl(selectedInvoice.totalAmount, `HOCPHI THANG ${selectedInvoice.month} ${students.find(s => s.id === selectedInvoice.studentId)?.name || ''}`, bankSettings)} 
                       alt="Payment QR" 
                       className="w-full aspect-square"
                     />
                  </div>
                  <p className="text-[9px] text-muted text-center leading-tight">
                    Quét mã QR để tự động nhập thông tin
                  </p>
               </div>
            </div>

            <div className="pt-2 md:pt-4 flex gap-3">
               <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 bg-accent-light text-muted rounded-xl text-xs md:text-sm font-bold hover:bg-hairline/50 transition-all border border-hairline px-4">
                 Đóng
               </button>
               <button onClick={async () => {
                 await billingService.markAsPaid(selectedInvoice.id);
                 toast('Xác nhận thu học phí thành công!', 'success');
                 setIsPaymentModalOpen(false);
                 fetchData();
               }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-emerald-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 px-4 whitespace-nowrap">
                 <CheckCircle2 size={16} />
                 Xác nhận đã thu
               </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => { if (!isGenerating) setIsGenerateOpen(false); }}
        title="Tạo hóa đơn theo kỳ"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Chọn kỳ cần tạo. Hệ thống đếm số buổi <b className="text-ink">có mặt</b> của từng học viên
            đang học trong kỳ rồi tạo hóa đơn <b className="text-ink">chưa thu</b>.
            Kỳ đã có hóa đơn sẽ <b className="text-ink">không bị tạo trùng</b>.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted mb-1 block uppercase">Tháng</label>
              <select
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold disabled:opacity-60"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted mb-1 block uppercase">Năm</label>
              <select
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold disabled:opacity-60"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-accent-light p-4 rounded-xl border border-hairline flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted uppercase mb-0.5">Kỳ tạo hóa đơn</p>
              <p className="text-sm font-bold text-ink">Tháng {genMonth}/{genYear}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted uppercase mb-0.5">Học viên đang học</p>
              <p className="text-base font-black text-coral">
                {students.filter(s => s.status === StudentStatus.ACTIVE).length}
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsGenerateOpen(false)}
              disabled={isGenerating}
              className="flex-1 py-3 text-muted font-bold hover:bg-accent-light rounded-xl transition-all border border-hairline disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleGenerateMonthly}
              disabled={isGenerating}
              className="flex-1 py-3 bg-coral text-white font-bold rounded-xl shadow-lg hover:shadow-coral/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Tạo hóa đơn
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Xuất hóa đơn tùy chỉnh"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted mb-1 block uppercase">Kỳ (tháng / năm)</label>
            <select
              value={expMonth === 'all' ? 'all' : `${expYear}-${expMonth}`}
              onChange={(e) => {
                if (e.target.value === 'all') { setExpMonth('all'); return; }
                const [y, m] = e.target.value.split('-').map(Number);
                setExpYear(y);
                setExpMonth(m);
              }}
              className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
            >
              <option value="all">Tất cả các kỳ</option>
              {availablePeriods.map(p => (
                <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                  Tháng {p.month}/{p.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted mb-1 block uppercase">Học viên</label>
            <select
              value={expStudent}
              onChange={(e) => setExpStudent(e.target.value)}
              className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
            >
              <option value="all">Tất cả học viên</option>
              {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted mb-1 block uppercase">Trạng thái</label>
              <select
                value={expStatus}
                onChange={(e) => setExpStatus(e.target.value as 'all' | InvoiceStatus)}
                className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
              >
                <option value="all">Tất cả</option>
                <option value={InvoiceStatus.PENDING}>Chờ thu</option>
                <option value={InvoiceStatus.PAID}>Đã đóng</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted mb-1 block uppercase">Định dạng</label>
              <div className="flex gap-2">
                {(['pdf', 'excel'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setExpFormat(f)}
                    className={cn(
                      "flex-1 p-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                      expFormat === f
                        ? "bg-coral text-white border-coral shadow-lg"
                        : "bg-card text-muted border-hairline hover:border-ink"
                    )}
                  >
                    {f === 'pdf' ? <FileText size={14} /> : <Download size={14} />}
                    {f === 'pdf' ? 'PDF' : 'Excel'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-accent-light p-4 rounded-xl border border-hairline flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted uppercase mb-0.5">Khối lượng xuất</p>
              <p className="text-sm font-bold text-ink">
                {filteredExportInvoices.length} hóa đơn
                {expFormat === 'pdf' && filteredExportInvoices.length === 1 && ' (phiếu thu chi tiết)'}
              </p>
              <p className="text-[11px] text-muted mt-0.5 italic">{exportDescription}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted uppercase mb-0.5">Tổng cộng</p>
              <p className="text-base font-black text-coral">
                {formatCurrency(filteredExportInvoices.reduce((acc, i) => acc + i.totalAmount, 0))}
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsExportOpen(false)}
              className="flex-1 py-3 text-muted font-bold hover:bg-accent-light rounded-xl transition-all border border-hairline"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredExportInvoices.length === 0}
              className="flex-1 py-3 bg-coral text-white font-bold rounded-xl shadow-lg hover:shadow-coral/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Xuất ngay
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa Hóa đơn"
      >
        <div className="space-y-4">
           <div>
              <label className="text-xs font-bold text-muted mb-1 block uppercase">Số tiền học phí (VNĐ)</label>
              <input 
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
              />
           </div>
           <div>
              <label className="text-xs font-bold text-muted mb-1 block uppercase">Trạng thái</label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as InvoiceStatus)}
                className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
              >
                <option value={InvoiceStatus.PENDING}>Chưa thanh toán</option>
                <option value={InvoiceStatus.PAID}>Đã thanh toán</option>
              </select>
           </div>
           <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 text-muted font-bold hover:bg-accent-light rounded-xl transition-all"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleUpdateInvoice}
                className="flex-1 py-3 bg-coral text-white font-bold rounded-xl shadow-lg hover:shadow-coral/20 transition-all active:scale-95"
              >
                Lưu thay đổi
              </button>
           </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="flex-1 py-3 bg-card border border-hairline text-muted rounded-xl font-bold hover:bg-accent-light transition-all"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={confirmDelete}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              Xóa ngay
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
