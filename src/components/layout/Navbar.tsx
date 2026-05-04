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
  Clock as ClockIcon,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '@/src/lib/firebase';
import { useTheme } from '@/src/lib/themeContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Navbar({ activeTab, setActiveTab, isOpen, onClose }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
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
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 py-1 md:hidden flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {menuItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
              activeTab === item.id ? "text-primary dark:text-accent" : "text-slate-400 dark:text-slate-600"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id && "scale-110")} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
            {activeTab === item.id && (
              <motion.div layoutId="bottom-nav-active" className="w-1 h-1 rounded-full bg-primary dark:bg-accent" />
            )}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'settings' ? "text-primary dark:text-accent" : "text-slate-400 dark:text-slate-600"
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:translate-x-0 md:z-auto md:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex flex-col gap-1 relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-6 p-2 md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-6 text-primary dark:text-white">
            <div className="w-8 h-8 rounded-full bg-primary dark:bg-accent flex items-center justify-center text-white dark:text-slate-900 scale-110">
              <GraduationCap size={18} />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">EduManage</h1>
          </div>
          <div className="h-px w-12 bg-accent/30 mb-2" />
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-600 uppercase">Hệ quản trị</p>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "group flex items-center gap-3 w-full px-4 py-3.5 text-[11px] font-black tracking-[0.15em] rounded-2xl transition-all duration-300 relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.15)] scale-[1.02]" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1"
              )}
            >
              <item.icon size={18} className={cn("transition-all duration-300", activeTab === item.id ? "scale-110 text-accent" : "group-hover:scale-110 group-hover:text-slate-900 dark:group-hover:text-white")} />
              <span className="relative z-10">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase ml-2">Giao diện</span>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-inner active:scale-90"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tài khoản</p>
            <div className="flex items-center gap-3">
               <img 
                 src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                 alt="Avatar" 
                 className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shadow-sm"
               />
               <div className="min-w-0">
                 <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user?.displayName || 'Admin'}</p>
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Quản lý cấp cao</p>
               </div>
            </div>
          </div>
          <button 
            id="logout-btn"
            onClick={() => auth.signOut()}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 hover:text-red-500 transition-all font-sans"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
