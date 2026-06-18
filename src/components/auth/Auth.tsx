import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { authSchema, registerSchema } from '@/src/lib/validation';
import { login, register as registerUser } from '@/src/lib/authStore';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = mode === 'register' ? registerSchema : authSchema;

  const { register: reg, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '' } as any
  });

  React.useEffect(() => {
    reset({ email: '', password: '', name: '' } as any);
  }, [mode, reset]);

  const handleAuthSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await registerUser(data.email, data.password, data.name);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 selection:bg-accent/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden w-full max-w-4xl min-h-[600px]"
      >
        {/* Left Side - Branding */}
        <div className="hidden md:flex bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-3xl -ml-32 -mb-32" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 mb-8 shadow-xl">
              <GraduationCap size={32} />
            </div>
            <h2 className="text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Quản lý <br/>
              <span className="text-accent underline decoration-1 underline-offset-4">Hệ thống Đào tạo</span>
            </h2>
            <p className="mt-6 text-slate-400 text-sm leading-relaxed font-light max-w-xs">
              Chào mừng bạn trở lại. Hãy đăng nhập để tiếp tục quản lý các khóa học và học viên của mình.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Premium Version Edition</p>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-accent flex items-center justify-center text-[10px] font-bold">+12</div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 md:hidden">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">EduManage</h1>
            <p className="text-slate-400 text-sm font-medium">
              {mode === 'login' ? 'Đăng nhập vào hệ thống quản trị' : 'Đăng ký tài khoản quản trị mới'}
            </p>
          </div>

          <form onSubmit={handleSubmit(handleAuthSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-[11px] font-black tracking-widest text-slate-700 uppercase ml-1">Họ Tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      {...(reg as any)('name')}
                      type="text" 
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                    />
                  </div>
                  {(errors as any).name && <p className="text-[10px] text-red-500 font-medium ml-1">{(errors as any).name.message as string}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black tracking-widest text-slate-700 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...reg('email')}
                  type="email" 
                  placeholder="admin@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.email.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black tracking-widest text-slate-700 uppercase ml-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...reg('password')}
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all outline-none"
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.password.message as string}</p>}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[11px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black tracking-widest uppercase text-xs py-4 px-6 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-slate-400">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-primary font-bold hover:underline"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
