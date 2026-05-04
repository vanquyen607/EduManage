import React from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings, 
  X,
  LogOut,
  GraduationCap,
  Star,
  Clock as ClockIcon
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '@/src/lib/firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Navbar({ activeTab, setActiveTab, isOpen, onClose }: NavbarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'TỔNG QUAN', icon: BarChart3 },
    { id: 'students', label: 'HỌC SINH', icon: Users },
    { id: 'classes', label: 'LỚP HỌC', icon: GraduationCap },
    { id: 'attendance', label: 'ĐIỂM DANH', icon: Calendar },
    { id: 'grades', label: 'KẾT QUẢ', icon: Star },
    { id: 'schedule', label: 'LỊCH HỌC', icon: ClockIcon },
    { id: 'billing', label: 'HỌC PHÍ', icon: CreditCard },
    { id: 'settings', label: 'CÀI ĐẶT', icon: Settings },
  ];

  const user = auth.currentUser;

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-100 px-2 py-1 md:hidden flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {menuItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
              activeTab === item.id ? "text-primary" : "text-slate-400"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id && "scale-110")} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
            {activeTab === item.id && (
              <motion.div layoutId="bottom-nav-active" className="w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'settings' ? "text-primary" : "text-slate-400"
          )}
        >
          <Settings size={20} className={cn(activeTab === 'settings' && "scale-110")} />
          <span className="text-[8px] font-black uppercase tracking-tighter">CÀI ĐẶT</span>
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:translate-x-0 md:z-auto md:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex flex-col gap-1 relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-6 p-2 md:hidden text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white scale-110">
              <GraduationCap size={18} />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">EduManage</h1>
          </div>
          <div className="h-px w-12 bg-accent/30 mb-2" />
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Hệ quản trị</p>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "group flex items-center gap-3 w-full px-4 py-3 text-[11px] font-black tracking-widest rounded-xl transition-all duration-300 relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={16} className={cn("transition-transform duration-300", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
              {item.label}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute right-0 top-0 bottom-0 w-1 bg-accent"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tài khoản</p>
            <div className="flex items-center gap-3">
               <img 
                 src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                 alt="Avatar" 
                 className="w-8 h-8 rounded-full bg-slate-200 shadow-sm"
               />
               <div className="min-w-0">
                 <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName || 'Admin'}</p>
                 <p className="text-[10px] text-slate-500 truncate">Quản lý cấp cao</p>
               </div>
            </div>
          </div>
          <button 
            id="logout-btn"
            onClick={() => auth.signOut()}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase rounded-xl border border-slate-200 hover:border-red-200 hover:text-red-500 transition-all font-sans"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
