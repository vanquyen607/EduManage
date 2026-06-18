import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  DollarSign, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Star,
  AlertCircle,
  PlusCircle,
  MoreVertical,
  Edit2,
  Trash2,
  QrCode,
  Copy
} from 'lucide-react';
import { useToast } from '@/src/lib/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notificationSchema } from '@/src/lib/validation';
import { StatCardSkeleton } from '@/src/components/ui/Skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import { studentService } from '@/src/services/studentService';
import { classService } from '@/src/services/classService';
import { billingService } from '@/src/services/billingService';
import { notificationService } from '@/src/services/notificationService';
import { cn, formatCurrency } from '@/src/lib/utils';
import { Student, Class, Invoice, Notification, InvoiceStatus, StudentStatus } from '@/src/types';
import Modal from '@/src/components/ui/Modal';
import { getPaymentQRUrl } from '@/src/lib/bankConfig';
import { settingsService, BankSettings } from '@/src/services/settingsService';

const data = [
  { name: 'Tháng 1', value: 45 },
  { name: 'Tháng 2', value: 52 },
  { name: 'Tháng 3', value: 48 },
  { name: 'Tháng 4', value: 61 },
  { name: 'Tháng 5', value: 55 },
  { name: 'Tháng 6', value: 67 },
];

export default function DashboardOverview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | undefined>();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);

  useEffect(() => {
    fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const [sData, cData, iData, nData] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
        billingService.getAll(),
        notificationService.getAll()
      ]);
      
      setStudents(sData);
      setClasses(cData);
      setInvoices(iData);
      setNotifications(nData);

      setStats({
        totalStudents: sData.length,
        activeClasses: cData.length,
        pendingInvoices: iData.filter(i => i.status === InvoiceStatus.PENDING).length,
        monthlyRevenue: iData.filter(i => i.status === InvoiceStatus.PAID).reduce((acc, curr) => acc + curr.totalAmount, 0)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessInvoice = async (invoiceId: string) => {
    try {
      await billingService.markAsPaid(invoiceId);
      toast('Xác nhận thu học phí thành công!', 'success');
      await fetchAllData();
    } catch (err) {
      toast('Có lỗi khi xử lý hóa đơn!', 'error');
    }
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await billingService.delete(invoiceToDelete);
      setIsConfirmDeleteOpen(false);
      setInvoiceToDelete(null);
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const showPaymentInfo = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleToggleStudent = async (student: Student) => {
    try {
      const newStatus = student.status === StudentStatus.ACTIVE ? StudentStatus.INACTIVE : StudentStatus.ACTIVE;
      await studentService.update(student.id, { status: newStatus });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await notificationService.delete(id);
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  // Revenue by Month data (last 6 months)
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const amount = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID && inv.month === month && inv.year === year)
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    return { name: `T${month}`, value: amount };
  });

  // Revenue by Class data
  const revenueByClass = classes.map(cls => {
    const amount = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID && students.find(s => s.id === inv.studentId)?.classId === cls.id)
      .reduce((acc, inv) => acc + inv.totalAmount, 0);
    return { name: cls.name, value: amount };
  });

  const [activeChart, setActiveChart] = useState<'month' | 'class'>('month');

  const activeStudents = students.filter(s => s.status === StudentStatus.ACTIVE).length;
  const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
  const totalInvoices = invoices.length;
  const paidRatio = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

  const statCards = [
    { label: 'TỔNG HỌC SINH', value: stats.totalStudents, icon: Users, color: 'bg-coral', trend: `${activeStudents} ĐANG HỌC` },
    { label: 'LỚP ĐÀO TẠO', value: stats.activeClasses, icon: GraduationCap, color: 'bg-coral', trend: 'ĐANG HOẠT ĐỘNG' },
    { label: 'HÓA ĐƠN CHỜ', value: stats.pendingInvoices, icon: AlertCircle, color: 'bg-accent-amber', trend: stats.pendingInvoices > 0 ? 'CẦN XỬ LÝ' : 'XONG' },
    { label: 'DOANH THU TỔNG', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-accent-amber', trend: `ĐÃ THU ${paidRatio}%` },
  ];

  const pendingInvoicesList = invoices.filter(i => i.status === InvoiceStatus.PENDING).slice(0, 3);
  const recentStudents = students.slice(0, 3);

  const quickActions = [
    { label: 'ĐIỂM DANH', icon: CalendarIcon, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'attendance' })); }, color: 'bg-coral/10 text-coral' },
    { label: 'THU HỌC PHÍ', icon: DollarSign, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'billing' })); }, color: 'bg-coral/10 text-coral' },
    { label: 'NHẬP ĐIỂM', icon: Star, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'grades' })); }, color: 'bg-accent-amber/20 text-accent-amber' },
    { label: 'LỊCH HỌC', icon: Clock, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'schedule' })); }, color: 'bg-accent-teal/20 text-accent-teal' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 md:pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="h-0.5 w-6 bg-accent-amber rounded-full" />
             <p className="text-[10px] font-semibold tracking-wider text-accent-amber uppercase">Dashboard</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-muted mt-1">Xin chào, Quản trị viên. Hệ thống đang vận hành tốt.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => { setSelectedNotif(undefined); setIsNotifModalOpen(true); }}
             className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-active transition-all active:scale-95"
           >
             POST ANNOUNCEMENT
           </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            onClick={action.action}
            className="flex items-center gap-3 p-4 bg-card rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className={cn("p-2.5 rounded-lg", action.color)}>
              <action.icon size={18} />
            </div>
            <span className="text-xs font-semibold text-body">{action.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card p-6 rounded-xl border border-hairline animate-pulse">
              <div className="w-12 h-12 bg-hairline/50 rounded-xl mb-6" />
              <div className="h-3 bg-hairline/50 rounded w-1/2 mb-2" />
              <div className="h-7 bg-hairline/50 rounded w-3/4 mb-2" />
              <div className="h-4 bg-accent-light rounded w-16" />
            </div>
          ))
        ) : statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="bg-card rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
          >
            <div className={cn("absolute -top-12 -right-12 w-32 h-32 opacity-5 rounded-full blur-2xl", stat.color)} />
            <div className="flex items-center justify-between mb-6">
              <div className={cn("p-3 rounded-xl text-white shadow-sm", stat.color)}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-ink leading-none truncate">{stat.value}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                  stat.trend === 'ĐANG HOẠT ĐỘNG' || stat.trend === 'XONG' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-hairline/50 text-muted dark:bg-card dark:text-muted"
                )}>
                  {stat.trend}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-xs font-medium text-muted mb-0.5">Dữ liệu tài chính</p>
                <h3 className="text-lg font-bold text-ink">
                  {activeChart === 'month' ? 'Doanh thu theo tháng' : 'Doanh thu theo lớp'}
                </h3>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-hairline/50 dark:bg-card rounded-lg">
                 <button 
                  onClick={() => setActiveChart('month')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    activeChart === 'month' ? "bg-card shadow-sm text-ink" : "text-muted hover:text-body"
                  )}
                 >
                   Theo tháng
                 </button>
                 <button 
                  onClick={() => setActiveChart('class')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    activeChart === 'class' ? "bg-card shadow-sm text-ink" : "text-muted hover:text-body"
                  )}
                 >
                   Theo lớp
                 </button>
              </div>
            </div>
            <div className="h-[280px] -ml-4">
              <ResponsiveContainer width="100%" height={280} minHeight={280}>
                {activeChart === 'month' ? (
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#cc785c" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#cc785c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6dfd8" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6c6a64', fontWeight: 500 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6c6a64', fontWeight: 500 }} 
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#252320', borderRadius: '12px', border: 'none', color: '#faf9f5' }}
                      itemStyle={{ color: '#faf9f5', fontSize: '11px', fontWeight: '600' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#cc785c" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={revenueByClass} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6dfd8" />
                    <XAxis 
                      type="number"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6c6a64', fontWeight: 500 }} 
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      width={100}
                      tick={{ fontSize: 10, fill: '#6c6a64', fontWeight: 500 }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#252320', borderRadius: '12px', border: 'none', color: '#faf9f5' }}
                      itemStyle={{ color: '#faf9f5', fontSize: '11px', fontWeight: '600' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Bar dataKey="value" fill="#cc785c" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-ink">Hóa đơn chờ xử lý</h3>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-3">
              {pendingInvoicesList.length > 0 ? pendingInvoicesList.map((inv, idx) => {
                const student = students.find(s => s.id === inv.studentId);
                return (
                  <motion.div 
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center justify-between p-3.5 bg-accent-light dark:bg-card/50 rounded-xl hover:bg-card dark:hover:bg-card hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted mb-0.5">#{inv.month}</p>
                      <p className="text-sm font-semibold text-ink truncate">{student?.name || 'Học sinh ẩn'}</p>
                      <p className="text-xs text-muted mt-0.5">{formatCurrency(inv.totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={(e) => showPaymentInfo(e, inv)}
                        className="p-2 text-muted hover:text-coral hover:bg-accent-light dark:hover:bg-coral/20 rounded-lg transition-all"
                      >
                        <QrCode size={15} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleProcessInvoice(inv.id); }}
                        className="p-2 text-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              }) : <div className="text-center py-6 text-muted text-sm">Tất cả đã thanh toán</div>}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 h-fit"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted mb-0.5">Lịch nhắc</p>
              <h3 className="text-base font-bold text-ink">Sự kiện & Task</h3>
            </div>
            <CalendarIcon size={16} className="text-muted-soft" />
          </div>
          
          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map((item, idx) => {
              const Icon = item.type === 'alert' ? AlertCircle : item.type === 'clock' ? Clock : CheckCircle2;
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-start gap-3"
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 mt-0.5",
                    item.status === 'urgent' ? "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400" : 
                    item.status === 'done' ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-accent-light text-accent-amber dark:bg-coral/20 dark:text-coral"
                  )}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-hairline pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-ink truncate">{item.title}</p>
                      <span className="text-[10px] text-muted whitespace-nowrap">{item.timeLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => { setSelectedNotif(item); setIsNotifModalOpen(true); }}
                         className="text-[10px] font-medium text-muted hover:text-coral transition-colors"
                       >
                         CHỈNH SỬA
                       </button>
                       <button 
                         onClick={() => handleDeleteNotif(item.id)}
                         className="text-[10px] font-medium text-muted hover:text-red-500 dark:hover:text-red-400 transition-colors"
                       >
                         GỠ BỎ
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="text-center py-8">
                <CalendarIcon size={28} className="mx-auto mb-2 text-muted-soft" />
                <p className="text-xs text-muted">Không có việc cần làm</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-accent-light dark:bg-coral/20 rounded-xl">
             <p className="text-xs font-semibold text-coral mb-1">Mẹo quản lý</p>
             <p className="text-xs text-muted leading-relaxed">
               Dùng tính năng Học phí để tự động gửi thông báo nhắc đóng phí khi tới kỳ hạn.
             </p>
          </div>
        </motion.div>
      </div>

      <Modal isOpen={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} title={selectedNotif ? 'Sửa thông báo' : 'Thêm thông báo'}>
         <NotificationForm 
            initialData={selectedNotif} 
            onSuccess={() => { setIsNotifModalOpen(false); fetchAllData(); }} 
            onCancel={() => setIsNotifModalOpen(false)}
         />
      </Modal>

      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title="Thông tin Thanh toán"
      >
        {selectedInvoice && bankSettings && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-accent-light p-4 rounded-xl border border-hairline flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-medium text-muted uppercase mb-0.5">Mã hóa đơn</p>
                  <p className="text-xs font-mono font-semibold text-body">#{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-medium text-muted uppercase mb-0.5">Số tiền</p>
                  <p className="text-base md:text-lg font-bold text-coral">{formatCurrency(selectedInvoice.totalAmount)}</p>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
               <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted mb-1 block">Ngân hàng</label>
                    <div className="bg-card border border-hairline p-2.5 rounded-lg flex items-center justify-between">
                       <span className="text-xs md:text-sm font-semibold">{bankSettings.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted mb-1 block">Số tài khoản</label>
                    <div className="bg-card border border-hairline p-2.5 rounded-lg flex items-center justify-between">
                       <span className="text-xs md:text-sm font-mono font-semibold text-coral">{bankSettings.accountNumber}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted mb-1 block">Chủ tài khoản</label>
                    <div className="bg-card border border-hairline p-2.5 rounded-lg">
                       <span className="text-xs md:text-sm font-semibold uppercase">{bankSettings.accountName}</span>
                    </div>
                  </div>
               </div>

               <div className="w-full md:w-44 flex flex-col items-center gap-2">
                  <div className="bg-card p-1.5 border-2 border-coral rounded-xl w-32 md:w-full">
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
               <button 
                 type="button"
                 onClick={() => setIsPaymentModalOpen(false)}
                 className="flex-1 py-2.5 text-sm font-medium text-muted bg-card dark:bg-transparent border border-hairline rounded-xl hover:bg-accent-light dark:hover:bg-card transition-colors"
               >
                 Đóng
               </button>
               <button 
                 type="button"
                 onClick={async () => {
                   await billingService.markAsPaid(selectedInvoice.id);
                   setIsPaymentModalOpen(false);
                   fetchAllData();
                 }}
                 className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                 <CheckCircle2 size={15} />
                 Xác nhận đã thu
               </button>
            </div>
          </div>
        )}
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
              className="flex-1 py-2.5 text-sm font-medium text-muted bg-card dark:bg-transparent border border-hairline rounded-xl hover:bg-accent-light dark:hover:bg-card transition-colors"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={confirmDeleteInvoice}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all shadow-sm"
            >
              Xóa ngay
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NotificationForm({ initialData, onSuccess, onCancel }: { initialData?: Notification, onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      timeLabel: initialData.timeLabel,
      status: initialData.status,
      type: initialData.type,
    } : {
      title: '',
      timeLabel: '',
      status: 'pending',
      type: 'clock'
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (initialData?.id) {
         await notificationService.update(initialData.id, data);
         toast('Cập nhật thông báo thành công!', 'success');
      } else {
         await notificationService.add(data);
         toast('Thêm thông báo thành công!', 'success');
      }
      onSuccess();
    } catch (err) {
      toast('Có lỗi khi lưu thông báo!', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
       <div>
         <label className="block text-xs font-medium text-muted uppercase mb-1">Nội dung</label>
         <input {...register('title')} className="w-full px-4 py-2.5 bg-card rounded-xl border border-hairline text-sm text-ink placeholder:text-muted focus:border-coral focus:ring-2 focus:ring-accent-light dark:focus:ring-coral/20 outline-none transition-colors" placeholder="Ví dụ: Chốt điểm danh lớp Piano" />
         {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title.message as string}</p>}
       </div>
       <div>
         <label className="block text-xs font-medium text-muted uppercase mb-1">Thời điểm hiển thị</label>
         <input {...register('timeLabel')} className="w-full px-4 py-2.5 bg-card rounded-xl border border-hairline text-sm text-ink placeholder:text-muted focus:border-coral focus:ring-2 focus:ring-accent-light dark:focus:ring-coral/20 outline-none transition-colors" placeholder="Ví dụ: 10:00 AM hoặc Hôm nay" />
         {errors.timeLabel && <p className="text-[10px] text-red-500 mt-1">{errors.timeLabel.message as string}</p>}
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase mb-1">Mức độ</label>
            <select {...register('status')} className="w-full px-4 py-2 bg-card border border-hairline rounded-xl outline-none cursor-pointer">
              <option value="pending">Bình thường</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase mb-1">Biểu tượng</label>
            <select {...register('type')} className="w-full px-4 py-2 bg-card border border-hairline rounded-xl outline-none cursor-pointer">
              <option value="clock">Thời gian</option>
              <option value="alert">Cảnh báo</option>
              <option value="check">Thành công</option>
            </select>
          </div>
       </div>
       <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-hairline/50 dark:hover:bg-card rounded-lg transition-colors">Hủy</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-active transition-all shadow-sm disabled:opacity-50">Lưu</button>
       </div>
    </form>
  );
}
