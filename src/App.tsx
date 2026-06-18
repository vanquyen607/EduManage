import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import DashboardOverview from './components/dashboard/DashboardOverview';
import StudentList from './components/students/StudentList';
import ClassList from './components/classes/ClassList';
import AttendanceManager from './components/attendance/AttendanceManager';
import InvoiceList from './components/billing/InvoiceList';
import Auth from './components/auth/Auth';
import GradeManager from './components/grades/GradeManager';
import ScheduleManager from './components/schedule/ScheduleManager';
import SettingsView from './components/settings/SettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from './lib/utils';
import { useTheme, themeConfig } from './lib/themeContext';
import type { Theme } from './lib/themeContext';
import { useAuth, logout, initAuth } from './lib/authStore';

export default function App() {
  const { theme, setTheme } = useTheme();
  const themes = Object.keys(themeConfig) as Theme[];
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAuth();

  useEffect(() => {
    const handleChangeTab = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleChangeTab);
    return () => {
      window.removeEventListener('changeTab', handleChangeTab);
    };
  }, []);

  useEffect(() => {
    initAuth().then(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center  text-muted">Đang tải dữ liệu...</div>;

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'students':
        return <StudentList />;
      case 'classes':
        return <ClassList />;
      case 'billing':
        return <InvoiceList />;
      case 'attendance':
        return <AttendanceManager />;
      case 'grades':
        return <GradeManager />;
      case 'schedule':
        return <ScheduleManager />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex bg-accent-light h-screen  selection:bg-coral/10 selection:text-coral relative overflow-hidden">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 h-screen overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-6">
        <header className="flex items-center justify-between mb-8 md:mb-12">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-white rounded-xl border border-hairline shadow-sm md:hidden hover:bg-accent-light transition-all active:scale-95"
              aria-label="Mở menu"
            >
            <Menu size={20} className="text-ink" />
          </button>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
             <div className="text-right hidden xs:block">
              <p className="text-sm font-bold text-ink dark:text-ink leading-none truncate max-w-[120px] md:max-w-none">{user?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-muted mt-1 uppercase font-black tracking-tighter">HỆ THỐNG QUẢN TRỊ</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const idx = themes.indexOf(theme);
                setTheme(themes[(idx + 1) % themes.length]);
              }}
              className="p-2.5 bg-card dark:bg-card rounded-xl border border-hairline shadow-sm hover:bg-accent-light dark:hover:bg-surface-dark-elevated transition-all active:scale-90"
              title={themeConfig[theme].label}
              aria-label={`Chuyển theme ${themeConfig[theme].label}`}
            >
              <span className="text-base leading-none">{themeConfig[theme].icon}</span>
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="group relative flex items-center"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <img 
                src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Avatar" 
                className="w-10 h-10 md:w-11 md:h-11 rounded-xl border-2 border-white shadow-xl group-hover:opacity-80 transition-all"
              />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
