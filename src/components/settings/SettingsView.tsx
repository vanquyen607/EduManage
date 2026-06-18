import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Download, 
  Trash2,
  Check,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  Edit
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useTheme, themeConfig } from '@/src/lib/themeContext';
import type { Theme } from '@/src/lib/themeContext';
import { useToast } from '@/src/lib/toast';
import { getCurrentUser, logout } from '@/src/lib/authStore';
import { api } from '@/src/lib/api';

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const themes = Object.keys(themeConfig) as Theme[];
  const { toast } = useToast();
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.updateProfile({ displayName, email });
      setMessage({ text: 'Cập nhật thành công!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [loadingAction, setLoadingAction] = useState<'none' | 'adding' | 'clearing'>('none');

  const menuItems = [
    { id: 'account', label: 'Tài khoản', icon: User },
    { id: 'system', label: 'Hệ thống', icon: SettingsIcon },
  ];

  const handleClearData = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.')) return;
    setLoadingAction('clearing');
    try {
      await api.clearData();
      setMessage({ text: 'Đã xóa toàn bộ dữ liệu thành công!', type: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setMessage({ text: 'Lỗi: ' + err.message, type: 'error' });
    } finally {
      setLoadingAction('none');
    }
  };

  const handleAddSampleData = async () => {
    setLoadingAction('adding');
    try {
      await api.seedData();
      setMessage({ text: 'Đã thêm dữ liệu mẫu thành công!', type: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setMessage({ text: 'Lỗi: ' + err.message, type: 'error' });
    } finally {
      setLoadingAction('none');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-3xl  font-bold text-ink dark:text-white">Cài đặt</h1>
        <p className="text-muted text-sm mt-1">Quản lý cấu hình hệ thống và tài khoản của bạn</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-2">
           {menuItems.map(item => (
             <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all",
                  activeTab === item.id ? "bg-coral text-white shadow-sm" : "text-muted dark:text-muted hover:bg-hairline/50 dark:hover:bg-card"
                )}
             >
                <item.icon size={16} />
                {item.label}
             </button>
           ))}
           <div className="pt-8 block lg:hidden">
              <hr className="border-hairline mb-4" />
           </div>
           <button 
             onClick={() => logout()}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase text-red-500 hover:bg-red-50 transition-all mt-auto"
           >
              <LogOut size={16} />
              Đăng xuất
           </button>
        </aside>

        <div className="flex-1 bg-card dark:bg-card rounded-[2.5rem] border border-hairline dark:border-hairline shadow-sm overflow-hidden min-h-[500px]">
           <div className="p-8 sm:p-12">
              {activeTab === 'account' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div>
                       <h3 className="text-xl  font-bold text-ink dark:text-white mb-1">Thông tin cá nhân</h3>
                      <p className="text-sm text-muted">Cập nhật thông tin nhận diện của bạn trên hệ thống</p>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <div className="relative group">
                        <img 
                          src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                          alt="Avatar" 
                          className="w-24 h-24 rounded-xl shadow-sm border-4 border-card"
                        />
                        <button onClick={() => toast({ title: 'Tính năng đang phát triển', description: 'Cập nhật ảnh đại diện sẽ sớm ra mắt' })} className="absolute -bottom-2 -right-2 bg-coral text-white p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                           <Edit size={14} />
                        </button>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Cấp độ</p>
                        <p className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-accent-light text-coral rounded-md text-[10px] font-medium">
                          <Check size={12} />
                          Quản lý cấp cao
                        </p>
                      </div>
                   </div>

                   <form onSubmit={handleUpdateAccount} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted uppercase tracking-widest ml-1">Tên hiển thị</label>
                            <input 
                              type="text" 
                              value={displayName || ''}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="w-full bg-accent-light border border-hairline rounded-xl px-6 py-4 text-sm focus:bg-card focus:border-coral transition-all outline-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted uppercase tracking-widest ml-1">Email quản trị</label>
                            <input 
                              type="email" 
                              value={email || ''}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-accent-light border border-hairline rounded-xl px-6 py-4 text-sm focus:bg-card focus:border-coral transition-all outline-none"
                            />
                         </div>
                      </div>

                      {message && (
                        <div className={cn(
                          "p-4 rounded-xl text-xs font-bold border",
                          message.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"
                        )}>
                          {message.text}
                        </div>
                      )}

                      <div className="pt-4">
                         <button 
                            type="submit"
                            disabled={loading}
                            className="bg-coral text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-coral-active transition-all active:scale-95 disabled:opacity-50"
                         >
                            {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                         </button>
                      </div>
                   </form>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div>
                       <h3 className="text-xl  font-bold text-ink dark:text-white mb-1">Thông báo & Email</h3>
                      <p className="text-sm text-muted">Tùy chỉnh cách bạn nhận tin nhắn từ hệ thống</p>
                   </div>
                   <div className="space-y-4">
                      {[
                        { title: 'Thông báo học phí', desc: 'Gửi nhắc nhở khi đến kỳ thu phí mới' },
                        { title: 'Điểm danh học sinh', desc: 'Báo cáo sĩ số hàng ngày qua email' },
                        { title: 'Cập nhật hệ thống', desc: 'Thông tin về các tính năng mới' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-accent-light rounded-xl border border-hairline">
                           <div>
                              <p className="text-sm font-bold text-ink">{item.title}</p>
                              <p className="text-xs text-muted">{item.desc}</p>
                           </div>
                           <div className="w-12 h-6 bg-coral rounded-full flex items-center px-1 shadow-sm">
                              <div className="w-4 h-4 bg-card rounded-full ml-auto" />
                           </div>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}

               {activeTab === 'security' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                        <h3 className="text-xl  font-bold text-ink dark:text-white mb-1">Mật khẩu & Bảo mật</h3>
                       <p className="text-sm text-muted">Giữ an toàn cho tài sản dữ liệu của bạn</p>
                    </div>
                    <div className="p-6 bg-surface-dark rounded-xl border border-hairline space-y-4">
                       <div className="p-3 bg-white/10 rounded-xl w-fit">
                          <Shield size={24} className="text-accent" />
                       </div>
                       <h4 className="text-lg font-bold">Xác thực 2 yếu tố (2FA)</h4>
                       <p className="text-xs text-muted leading-relaxed">Tăng cường bảo mật bằng cách yêu cầu mã xác thực từ điện thoại mỗi khi bạn đăng nhập từ thiết bị lạ.</p>
                        <button onClick={() => toast({ title: 'Tính năng đang phát triển', description: 'Xác thực 2FA sẽ sớm ra mắt' })} className="bg-coral text-white px-5 py-2.5 rounded-xl text-xs font-medium hover:bg-coral-active transition-all transition-all">
                          KÍCH HOẠT NGAY
                        </button>
                    </div>
                 </motion.div>
               )}

               {activeTab === 'system' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                        <h3 className="text-xl  font-bold text-ink dark:text-white mb-1">Quản lý dữ liệu hệ thống</h3>
                       <p className="text-sm text-muted">Thiết lập dữ liệu mẫu hoặc xóa sạch dữ liệu để bắt đầu mới</p>
                    </div>

                      <div>
                         <h4 className="text-lg font-bold text-ink mb-4">Giao diện</h4>
                         <div className="p-6 bg-accent-light dark:bg-card rounded-xl border border-hairline">
                            <div className="flex items-center gap-3 mb-5">
                               <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                                  <span className="text-lg">{themeConfig[theme].icon}</span>
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-ink">Chủ đề giao diện</p>
                                  <p className="text-xs text-muted mt-0.5">{themeConfig[theme].label} — {themeConfig[theme].light ? 'Sáng' : 'Tối'}</p>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {themes.map(t => {
                                const cfg = themeConfig[t];
                                const active = theme === t;
                                return (
                                  <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={cn(
                                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all",
                                      active ? "bg-card shadow-sm text-ink border border-hairline" : "text-muted hover:text-body hover:bg-hairline/50 border border-transparent"
                                    )}
                                  >
                                    <span className="text-lg leading-none">{cfg.icon}</span>
                                    <span className="font-medium">{cfg.label}</span>
                                    {active && <Check size={12} className="ml-auto text-coral" />}
                                  </button>
                                );
                              })}
                            </div>
                         </div>
                      </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-accent-light dark:bg-card rounded-[2rem] border border-hairline dark:border-hairline flex flex-col justify-between h-full">
                           <div className="space-y-4 mb-8">
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                 <Globe size={24} />
                              </div>
                              <h4 className="text-lg font-bold text-ink dark:text-white leading-tight">Dữ liệu mẫu trải nghiệm</h4>
                              <p className="text-xs text-muted leading-relaxed">
                                 Tự động tạo các lớp học, học sinh, điểm số và thông báo mẫu để bạn có thể trải nghiệm đầy đủ tính năng của hệ thống ngay lập tức.
                              </p>
                           </div>
                           <button 
                              onClick={handleAddSampleData}
                              disabled={loadingAction !== 'none'}
                              className="w-full bg-coral text-white py-3.5 rounded-xl text-xs font-medium shadow-sm hover:bg-coral-active transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                           >
                              {loadingAction === 'adding' ? 'ĐANG XỬ LÝ...' : (
                                <>
                                  <Download size={16} />
                                  THÊM DỮ LIỆU MẪU
                                </>
                              )}
                           </button>
                        </div>

                        <div className="p-8 bg-red-50/30 dark:bg-red-950/20 rounded-[2rem] border border-red-100 dark:border-red-900/30 flex flex-col justify-between h-full">
                           <div className="space-y-4 mb-8">
                              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                 <Trash2 size={24} />
                              </div>
                              <h4 className="text-lg font-bold text-ink dark:text-white leading-tight">Xóa sạch toàn bộ dữ liệu</h4>
                              <p className="text-xs text-muted leading-relaxed">
                                 Xóa tất cả các bản ghi hiện có (Lớp học, Học sinh, Điểm số, Hóa đơn...) để chuẩn bị cho việc nhập liệu thật. <span className="font-bold text-red-500">Hành động này không thể hoàn tác!</span>
                              </p>
                           </div>
                           <button 
                              onClick={handleClearData}
                              disabled={loadingAction !== 'none'}
                              className="w-full bg-card dark:bg-transparent border-2 border-red-100 dark:border-red-900 text-red-500 py-4 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                           >
                              {loadingAction === 'clearing' ? 'ĐANG XỬ LÝ...' : (
                                <>
                                  <Trash2 size={16} />
                                  BẮT ĐẦU MỚI (RESET)
                                </>
                              )}
                           </button>
                        </div>
                     </div>

                    {message && (
                      <div className={cn(
                        "p-6 rounded-[2rem] text-sm font-bold border-2 animate-in fade-in slide-in-from-bottom-4 duration-300",
                        message.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"
                      )}>
                        {message.text}
                      </div>
                    )}
                 </motion.div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}
