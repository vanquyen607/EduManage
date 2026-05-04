import React, { useState } from 'react';
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

import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-sans text-slate-400">Đang tải dữ liệu...</div>;

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
    <div className="flex bg-slate-50 min-h-screen font-sans selection:bg-primary/10 selection:text-primary relative overflow-hidden">
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
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm md:hidden hover:bg-slate-50 transition-all active:scale-95"
          >
            <Menu size={20} className="text-slate-900" />
          </button>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
             <div className="text-right hidden xs:block">
              <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[120px] md:max-w-none">{user.displayName || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-tighter">HỆ THỐNG QUẢN TRỊ</p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="group relative flex items-center"
            >
              <img 
                src={user.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Avatar" 
                className="w-10 h-10 md:w-11 md:h-11 rounded-2xl border-2 border-white shadow-xl group-hover:opacity-80 transition-all"
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
