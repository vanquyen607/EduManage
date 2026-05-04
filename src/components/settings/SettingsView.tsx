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
  Moon,
  Edit
} from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export default function SettingsView() {
  const user = auth.currentUser;
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      if (email !== user.email) {
        await updateEmail(user, email);
      }
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
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'system', label: 'Hệ thống', icon: SettingsIcon },
    { id: 'billing', label: 'Gói dịch vụ', icon: CreditCard },
  ];

  const handleClearData = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.')) return;
    setLoadingAction('clearing');
    try {
      const { demoService } = await import('@/src/lib/demoService');
      await demoService.clearAllData();
      setMessage({ text: 'Đã xóa toàn bộ dữ liệu thành công!', type: 'success' });
      // Reload page to refresh all state
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
      const { demoService } = await import('@/src/lib/demoService');
      await demoService.addSampleData();
      setMessage({ text: 'Đã thêm dữ liệu mẫu thành công!', type: 'success' });
      // Reload page to refresh all state
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
        <h1 className="text-3xl font-serif font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý cấu hình hệ thống và tài khoản của bạn</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-2">
           {menuItems.map(item => (
             <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all",
                  activeTab === item.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
                )}
             >
                <item.icon size={16} />
                {item.label}
             </button>
           ))}
           <div className="pt-8 block lg:hidden">
              <hr className="border-slate-100 mb-4" />
           </div>
           <button 
             onClick={() => auth.signOut()}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black tracking-widest uppercase text-red-500 hover:bg-red-50 transition-all mt-auto"
           >
              <LogOut size={16} />
              Đăng xuất
           </button>
        </aside>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
           <div className="p-8 sm:p-12">
              {activeTab === 'account' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div>
                      <h3 className="text-xl font-serif font-bold text-slate-900 mb-1">Thông tin cá nhân</h3>
                      <p className="text-sm text-slate-500">Cập nhật thông tin nhận diện của bạn trên hệ thống</p>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <div className="relative group">
                        <img 
                          src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                          alt="Avatar" 
                          className="w-24 h-24 rounded-[2rem] shadow-xl border-4 border-white"
                        />
                        <button className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                           <Edit size={14} />
                        </button>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp độ</p>
                        <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black tracking-widest uppercase">
                          <Check size={12} />
                          Quản lý cấp cao
                        </p>
                      </div>
                   </div>

                   <form onSubmit={handleUpdateAccount} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hiển thị</label>
                            <input 
                              type="text" 
                              value={displayName || ''}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:bg-white focus:border-slate-900 transition-all outline-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email quản trị</label>
                            <input 
                              type="email" 
                              value={email || ''}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:bg-white focus:border-slate-900 transition-all outline-none"
                            />
                         </div>
                      </div>

                      {message && (
                        <div className={cn(
                          "p-4 rounded-2xl text-xs font-bold border",
                          message.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"
                        )}>
                          {message.text}
                        </div>
                      )}

                      <div className="pt-4">
                         <button 
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
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
                      <h3 className="text-xl font-serif font-bold text-slate-900 mb-1">Thông báo & Email</h3>
                      <p className="text-sm text-slate-500">Tùy chỉnh cách bạn nhận tin nhắn từ hệ thống</p>
                   </div>
                   <div className="space-y-4">
                      {[
                        { title: 'Thông báo học phí', desc: 'Gửi nhắc nhở khi đến kỳ thu phí mới' },
                        { title: 'Điểm danh học sinh', desc: 'Báo cáo sĩ số hàng ngày qua email' },
                        { title: 'Cập nhật hệ thống', desc: 'Thông tin về các tính năng mới' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div>
                              <p className="text-sm font-bold text-slate-800">{item.title}</p>
                              <p className="text-xs text-slate-500">{item.desc}</p>
                           </div>
                           <div className="w-12 h-6 bg-slate-900 rounded-full flex items-center px-1">
                              <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                           </div>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}

               {activeTab === 'security' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                       <h3 className="text-xl font-serif font-bold text-slate-900 mb-1">Mật khẩu & Bảo mật</h3>
                       <p className="text-sm text-slate-500">Giữ an toàn cho tài sản dữ liệu của bạn</p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                       <div className="p-3 bg-white/10 rounded-2xl w-fit">
                          <Shield size={24} className="text-accent" />
                       </div>
                       <h4 className="text-lg font-bold">Xác thực 2 yếu tố (2FA)</h4>
                       <p className="text-xs text-slate-400 leading-relaxed">Tăng cường bảo mật bằng cách yêu cầu mã xác thực từ điện thoại mỗi khi bạn đăng nhập từ thiết bị lạ.</p>
                       <button className="bg-white text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-accent transition-all">
                         KÍCH HOẠT NGAY
                       </button>
                    </div>
                 </motion.div>
               )}

               {activeTab === 'system' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                       <h3 className="text-xl font-serif font-bold text-slate-900 mb-1">Quản lý dữ liệu hệ thống</h3>
                       <p className="text-sm text-slate-500">Thiết lập dữ liệu mẫu hoặc xóa sạch dữ liệu để bắt đầu mới</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between h-full">
                          <div className="space-y-4 mb-8">
                             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <Globe size={24} />
                             </div>
                             <h4 className="text-lg font-bold text-slate-900 leading-tight">Dữ liệu mẫu trải nghiệm</h4>
                             <p className="text-xs text-slate-500 leading-relaxed">
                                Tự động tạo các lớp học, học sinh, điểm số và thông báo mẫu để bạn có thể trải nghiệm đầy đủ tính năng của hệ thống ngay lập tức.
                             </p>
                          </div>
                          <button 
                             onClick={handleAddSampleData}
                             disabled={loadingAction !== 'none'}
                             className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                             {loadingAction === 'adding' ? 'ĐANG XỬ LÝ...' : (
                               <>
                                 <Download size={16} />
                                 THÊM DỮ LIỆU MẪU
                               </>
                             )}
                          </button>
                       </div>

                       <div className="p-8 bg-red-50/30 rounded-[2rem] border border-red-100 flex flex-col justify-between h-full">
                          <div className="space-y-4 mb-8">
                             <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                                <Trash2 size={24} />
                             </div>
                             <h4 className="text-lg font-bold text-slate-900 leading-tight">Xóa sạch toàn bộ dữ liệu</h4>
                             <p className="text-xs text-slate-400 leading-relaxed">
                                Xóa tất cả các bản ghi hiện có (Lớp học, Học sinh, Điểm số, Hóa đơn...) để chuẩn bị cho việc nhập liệu thật. <span className="font-bold text-red-500">Hành động này không thể hoàn tác!</span>
                             </p>
                          </div>
                          <button 
                             onClick={handleClearData}
                             disabled={loadingAction !== 'none'}
                             className="w-full bg-white border-2 border-red-100 text-red-500 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
