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
  Settings
} from 'lucide-react';
import { billingService } from '@/src/services/billingService';
import { studentService } from '@/src/services/studentService';
import { Invoice, Student, InvoiceStatus } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { motion } from 'motion/react';
import Modal from '@/src/components/ui/Modal';
import { getPaymentQRUrl } from '@/src/lib/bankConfig';
import { settingsService, BankSettings } from '@/src/services/settingsService';
import BankSettingsForm from './BankSettingsForm';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
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
      const [iData, sData] = await Promise.all([
        billingService.getAll(),
        studentService.getAll()
      ]);
      setInvoices(iData);
      setStudents(sData);
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
      setIsConfirmDeleteOpen(false);
      setInvoiceToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
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
    try {
      await billingService.update(selectedInvoice.id, {
        totalAmount: editAmount,
        status: editStatus
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Silent success for environment compatibility
    console.log('Copied to clipboard: ' + text);
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Tài chính & Học phí</p>
          </div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Quản lý Học phí</h2>
          <p className="text-slate-500 text-sm mt-1">Theo dõi doanh thu, trạng thái thanh toán và xuất hóa đơn.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) loadBankSettings();
            }}
            className={cn(
              "px-6 py-3 rounded-xl transition-all border flex items-center gap-2 text-[10px] font-black tracking-widest uppercase",
              showSettings ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:border-slate-800 shadow-sm"
            )}
          >
            <Settings size={14} />
            Cài đặt bank
          </button>
          <button 
            type="button"
            onClick={async () => {
              setIsLoading(true);
              const currentMonth = new Date().getMonth() + 1;
              const currentYear = new Date().getFullYear();
              let createdCount = 0;
              let skippedCount = 0;

              for (const s of students) {
                 const exists = invoices.some(inv => 
                    inv.studentId === s.id && 
                    inv.month === currentMonth && 
                    inv.year === currentYear
                 );

                 if (!exists) {
                   try {
                     await billingService.generateInvoice(s.id, currentMonth, currentYear);
                     createdCount++;
                   } catch(e) { console.error(e); }
                 } else {
                   skippedCount++;
                 }
              }

              if (createdCount > 0) {
                console.log(`Successfully created ${createdCount} invoices for month ${currentMonth}.`);
              } else if (skippedCount > 0) {
                console.log(`All invoices for month ${currentMonth}/${currentYear} already exist.`);
              }

              fetchData();
              setIsLoading(false);
            }}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            <ArrowRight size={14} />
            Tạo hóa đơn tháng
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
          { label: 'CHỜ THANH TOÁN', value: `${invoices.filter(i => i.status === InvoiceStatus.PENDING).length} hóa đơn`, color: 'bg-blue-600' },
          { label: 'ĐÃ HOÀN THÀNH', value: `${invoices.filter(i => i.status === InvoiceStatus.PAID).length} hóa đơn`, color: 'bg-emerald-600' },
          { label: 'TỔNG CỘNG', value: formatCurrency(invoices.reduce((acc, i) => acc + i.totalAmount, 0)), color: 'bg-accent' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
             <div className={cn("absolute -top-4 -right-4 w-20 h-20 opacity-5 rounded-full blur-xl transition-transform duration-500 group-hover:scale-150", stat.color)} />
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
             <p className="text-3xl font-serif font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-6 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-50 rounded w-full" />
              </div>
            ))
          ) : invoices.map((invoice, idx) => {
            const student = students.find(s => s.id === invoice.studentId);
            return (
              <div key={invoice.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{student?.name || 'N/A'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tháng {invoice.month}/{invoice.year}</p>
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
                    <p className="text-lg font-serif font-black text-slate-900">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter italic">{invoice.sessionCount} buổi thực tế</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => handleEditClick(e, invoice)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Edit2 size={16} /></button>
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
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Học sinh</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thời gian</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số tiền</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(4)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-8"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                  </tr>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((invoice, idx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={invoice.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                           {students.find(s => s.id === invoice.studentId)?.name?.charAt(0) || '?'}
                         </div>
                         <div>
                            <p className="font-bold text-slate-900">
                              {students.find(s => s.id === invoice.studentId)?.name || 'N/A'}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {invoice.id.slice(0, 8)}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Tháng {invoice.month}/{invoice.year}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter italic">{invoice.sessionCount} buổi thực tế</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-serif text-lg font-bold text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
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
                         <button 
                          type="button"
                          onClick={(e) => handleEditClick(e, invoice)}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                         >
                          <Edit2 size={16} />
                         </button>
                         <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id); }}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                         >
                          <Trash2 size={16} />
                         </button>
                         {invoice.status === InvoiceStatus.PENDING && (
                          <button 
                            type="button"
                            onClick={(e) => handlePayment(e, invoice)}
                            className="ml-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-md active:scale-95 transition-all"
                          >
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
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Không có hóa đơn khả dụng</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Info Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title="Thông tin Thanh toán"
      >
        {selectedInvoice && bankSettings && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mã hóa đơn</p>
                  <p className="text-xs font-mono font-bold text-slate-700">#{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Số tiền</p>
                  <p className="text-base md:text-lg font-black text-primary">{formatCurrency(selectedInvoice.totalAmount)}</p>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
               <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Ngân hàng</label>
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between group">
                       <span className="text-xs md:text-sm font-semibold">{bankSettings.name}</span>
                       <button onClick={() => copyToClipboard(bankSettings.name)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all">
                          <Copy size={12} />
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Số tài khoản</label>
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between group">
                       <span className="text-xs md:text-sm font-mono font-bold text-primary">{bankSettings.accountNumber}</span>
                       <button onClick={() => copyToClipboard(bankSettings.accountNumber)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all">
                          <Copy size={12} />
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Chủ tài khoản</label>
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
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
                  <p className="text-[9px] text-slate-400 text-center leading-tight">
                    Quét mã QR để tự động nhập thông tin
                  </p>
               </div>
            </div>

            <div className="pt-2 md:pt-4 flex gap-3">
               <button 
                 onClick={() => setIsPaymentModalOpen(false)}
                 className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-all border border-slate-100 px-4"
               >
                 Đóng
               </button>
               <button 
                 onClick={async () => {
                   await billingService.markAsPaid(selectedInvoice.id);
                   setIsPaymentModalOpen(false);
                   fetchData();
                 }}
                 className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-emerald-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 px-4 whitespace-nowrap"
               >
                 <CheckCircle2 size={16} />
                 Xác nhận đã thu
               </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa Hóa đơn"
      >
        <div className="space-y-4">
           <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Số tiền học phí (VNĐ)</label>
              <input 
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
              />
           </div>
           <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Trạng thái</label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as InvoiceStatus)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
              >
                <option value={InvoiceStatus.PENDING}>Chưa thanh toán</option>
                <option value={InvoiceStatus.PAID}>Đã thanh toán</option>
              </select>
           </div>
           <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleUpdateInvoice}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
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
          <p className="text-sm text-slate-600">Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
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
