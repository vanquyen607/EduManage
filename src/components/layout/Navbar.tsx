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
  Check
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, themeConfig } from '@/src/lib/themeContext';
import type { Theme } from '@/src/lib/themeContext';
import { getCurrentUser, logout } from '@/src/lib/authStore';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Navbar({ activeTab, setActiveTab, isOpen, onClose }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const user = getCurrentUser();
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

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-hairline px-2 py-1 md:hidden flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {menuItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
              activeTab === item.id ? "text-coral dark:text-coral" : "text-muted dark:text-muted"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id && "scale-110")} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
            {activeTab === item.id && (
              <motion.div layoutId="bottom-nav-active" className="w-1 h-1 rounded-full bg-coral dark:bg-coral" />
            )}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === 'settings' ? "text-coral dark:text-coral" : "text-muted dark:text-muted"
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-hairline flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:translate-x-0 md:z-auto md:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex flex-col gap-1 relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-6 p-2 md:hidden text-muted hover:text-body dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center text-white shadow-sm">
              <GraduationCap size={20} />
            </div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-ink">EduManage</h1>
          </div>
          <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">Hệ thống quản lý giáo dục</p>
          <div className="h-px bg-hairline/50 mt-4" />
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
                  ? "bg-coral text-white shadow-[0_4px_12px_rgba(204,120,92,0.3)]" 
                  : "text-muted hover:bg-hairline/50 dark:hover:bg-card hover:text-ink dark:hover:text-white"
              )}
            >
              <item.icon size={18} className={cn("transition-all duration-300", activeTab === item.id ? "scale-110" : "group-hover:scale-110 group-hover:text-ink dark:group-hover:text-white")} />
              <span className="relative z-10">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-coral"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">Giao diện</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(themeConfig) as Theme[]).map(t => {
                const cfg = themeConfig[t];
                const active = theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-medium transition-all",
                      active ? "bg-card shadow-sm text-ink" : "text-muted hover:text-body hover:bg-hairline/50"
                    )}
                  >
                    <span className="text-xs">{cfg.icon}</span>
                    <span className="truncate">{cfg.label}</span>
                    {active && <Check size={10} className="ml-auto text-coral" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <img 
                src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Avatar" 
                className="w-9 h-9 rounded-lg bg-hairline/50 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{user?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-muted truncate">Quản trị viên</p>
              </div>
            </div>
          </div>
          <button 
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-muted dark:text-muted rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 dark:hover:text-red-400 transition-all"
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
