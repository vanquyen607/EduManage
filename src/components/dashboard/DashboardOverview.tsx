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
    }
  };

  const handleProcessInvoice = async (invoiceId: string) => {
    try {
      await billingService.markAsPaid(invoiceId);
      await fetchAllData();
    } catch (err) {
      console.error(err);
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

  const statCards = [
    { label: 'TỔNG HỌC SINH', value: stats.totalStudents, icon: Users, color: 'bg-slate-900', trend: '+12%', sub: 'Học viên active' },
    { label: 'LỚP ĐÀO TẠO', value: stats.activeClasses, icon: GraduationCap, color: 'bg-slate-900', trend: 'ỔN ĐỊNH', sub: 'Chương trình chạy' },
    { label: 'HÓA ĐƠN CHỜ', value: stats.pendingInvoices, icon: AlertCircle, color: 'bg-red-500', trend: stats.pendingInvoices > 0 ? 'CẦN XỬ LÝ' : 'XONG', sub: 'Chưa thu tiền' },
    { label: 'DOANH THU TỔNG', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-accent', trend: '+18.4%', sub: 'Dòng tiền hệ thống' },
  ];

  const pendingInvoicesList = invoices.filter(i => i.status === InvoiceStatus.PENDING).slice(0, 3);
  const recentStudents = students.slice(0, 3);

  const quickActions = [
    { label: 'ĐIỂM DANH', icon: CalendarIcon, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'attendance' })); }, color: 'bg-blue-50 text-blue-600' },
    { label: 'THU HỌC PHÍ', icon: DollarSign, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'billing' })); }, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'NHẬP ĐIỂM', icon: Star, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'grades' })); }, color: 'bg-amber-50 text-amber-600' },
    { label: 'LỊCH HỌC', icon: Clock, action: () => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'schedule' })); }, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-12 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="h-0.5 w-6 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.3em] text-accent uppercase">Mission Control</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-none italic">
            Dashboard <span className="text-slate-300 font-light not-italic">Overview</span>
          </h2>
          <p className="text-slate-400 text-sm mt-3 font-medium">Xin chào, Quản trị viên. Hệ thống đang vận hành tốt.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex -space-x-3 mr-4">
              {recentStudents.map((s, i) => (
                <div key={i} className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                  {s.name.charAt(0)}
                </div>
              ))}
              <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-lg">
                +{stats.totalStudents}
              </div>
           </div>
           <button 
             onClick={() => { setSelectedNotif(undefined); setIsNotifModalOpen(true); }}
             className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase hover:bg-accent hover:shadow-[0_20px_40px_rgba(194,65,12,0.2)] hover:-translate-y-1 transition-all shadow-xl shadow-slate-200 active:scale-95"
           >
             POST ANNOUNCEMENT
           </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            onClick={action.action}
            className={cn(
              "flex items-center gap-4 p-4 rounded-3xl border border-slate-100 transition-all hover:border-slate-900 hover:shadow-xl group",
              action.color
            )}
          >
            <div className="p-3 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform">
              <action.icon size={20} />
            </div>
            <span className="text-[10px] font-black tracking-widest text-slate-900">{action.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="group bg-card-bg p-6 md:p-8 rounded-[2rem] border border-border-main shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
          >
            <div className={cn("absolute -top-12 -right-12 w-32 h-32 transform opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 rounded-full blur-2xl", stat.color)} />
            <div className="flex items-start justify-between mb-8">
              <div className={cn("p-4 rounded-2xl text-white shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform duration-500", stat.color)}>
                <stat.icon size={22} />
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 transition-colors group-hover:text-slate-500">{stat.label}</p>
              <p className="text-xl md:text-3xl font-serif font-bold text-slate-900 leading-none truncate">{stat.value}</p>
              <div className="flex items-center gap-2 mt-4">
                <span className={cn(
                  "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter",
                  stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                )}>
                  {stat.trend}
                </span>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-slate-400 transition-colors">vs tháng trước</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card-bg p-8 rounded-[2rem] border border-border-main shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Dữ liệu tài chính</p>
                <h3 className="font-serif font-bold text-2xl text-slate-900">
                  {activeChart === 'month' ? 'Doanh thu theo tháng' : 'Doanh thu theo lớp'}
                </h3>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl">
                 <button 
                  onClick={() => setActiveChart('month')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    activeChart === 'month' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
                 >
                   THEO THÁNG
                 </button>
                 <button 
                  onClick={() => setActiveChart('class')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    activeChart === 'class' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
                 >
                   THEO LỚP
                 </button>
              </div>
            </div>
            <div className="h-[320px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                {activeChart === 'month' ? (
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0f172a" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={revenueByClass} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis 
                      type="number"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      width={100}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Bar dataKey="value" fill="#c2410c" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-bold text-xl text-slate-900">Hóa đơn chờ xử lý</h3>
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div className="space-y-4">
              {pendingInvoicesList.length > 0 ? pendingInvoicesList.map((inv, idx) => {
                const student = students.find(s => s.id === inv.studentId);
                return (
                  <motion.div 
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-0.5">#{inv.month}</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{student?.name || 'Học sinh ẩn'}</p>
                      <p className="text-xs font-mono text-slate-500 mt-1">{formatCurrency(inv.totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        type="button"
                        onClick={(e) => showPaymentInfo(e, inv)}
                        className="p-2 text-primary hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <QrCode size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleProcessInvoice(inv.id); }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              }) : <div className="text-center py-6 text-slate-400 text-xs italic">Tất cả đã thanh toán</div>}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <CalendarIcon size={120} />
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Lịch nhắc</p>
              <h3 className="font-serif font-bold text-2xl text-slate-900">Sự kiện & Task</h3>
            </div>
            <CalendarIcon size={20} className="text-primary" />
          </div>
          
          <div className="space-y-6">
            {notifications.length > 0 ? notifications.map((item, idx) => {
              const Icon = item.type === 'alert' ? AlertCircle : item.type === 'clock' ? Clock : CheckCircle2;
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="group flex items-start gap-4"
                >
                  <div className={cn(
                    "p-2.5 rounded-xl shrink-0 mt-0.5",
                    item.status === 'urgent' ? "bg-red-50 text-red-500" : 
                    item.status === 'done' ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"
                  )}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900 truncate leading-none">{item.title}</p>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{item.timeLabel}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => { setSelectedNotif(item); setIsNotifModalOpen(true); }}
                         className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors underline-offset-4 hover:underline"
                       >
                         CHỈNH SỬA
                       </button>
                       <button 
                         onClick={() => handleDeleteNotif(item.id)}
                         className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors underline-offset-4 hover:underline"
                       >
                         GỠ BỎ
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="text-center py-12 opacity-30">
                <CalendarIcon size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Không có việc cần làm</p>
              </div>
            )}
          </div>

          <div className="mt-10 p-5 bg-primary/5 rounded-2xl border border-primary/10">
             <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Mẹo quản lý</p>
             <p className="text-xs text-slate-600 leading-relaxed italic">
               "Dùng tính năng Học phí để tự động gửi thông báo nhắc đóng phí khi tới kỳ hạn."
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
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                       <span className="text-xs md:text-sm font-semibold">{bankSettings.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Số tài khoản</label>
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                       <span className="text-xs md:text-sm font-mono font-bold text-primary">{bankSettings.accountNumber}</span>
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
                 type="button"
                 onClick={() => setIsPaymentModalOpen(false)}
                 className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-all border border-slate-100 px-4"
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
                 className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-emerald-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 px-4 whitespace-nowrap"
               >
                 <CheckCircle2 size={16} />
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
              onClick={confirmDeleteInvoice}
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

function NotificationForm({ initialData, onSuccess, onCancel }: { initialData?: Notification, onSuccess: () => void, onCancel: () => void }) {
  const [formData, setFormData] = useState<Partial<Notification>>(initialData || {
    title: '',
    timeLabel: '',
    status: 'pending',
    type: 'clock'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
         await notificationService.update(initialData.id, formData);
      } else {
         await notificationService.add(formData as Omit<Notification, 'id' | 'createdAt'>);
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving notification:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
       <div>
         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nội dung</label>
         <input 
           required
           className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
           value={formData.title}
           onChange={e => setFormData({ ...formData, title: e.target.value })}
           placeholder="Ví dụ: Chốt điểm danh lớp Piano"
         />
       </div>
       <div>
         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thời điểm hiển thị</label>
         <input 
           required
           className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
           value={formData.timeLabel}
           onChange={e => setFormData({ ...formData, timeLabel: e.target.value })}
           placeholder="Ví dụ: 10:00 AM hoặc Hôm nay"
         />
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mức độ</label>
            <select 
               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
               value={formData.status}
               onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="pending">Bình thường</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Biểu tượng</label>
            <select 
               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
               value={formData.type}
               onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="clock">Thời gian</option>
              <option value="alert">Cảnh báo</option>
              <option value="check">Thành công</option>
            </select>
          </div>
       </div>
       <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Hủy</button>
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all">Lưu</button>
       </div>
    </form>
  );
}
