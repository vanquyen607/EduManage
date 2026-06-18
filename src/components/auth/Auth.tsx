import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { authSchema, registerSchema } from '@/src/lib/validation';
import { login, register as registerUser } from '@/src/lib/authStore';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6 selection:bg-accent/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-accent/10 to-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/10 to-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-accent/[0.02] to-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grid md:grid-cols-2 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden w-full max-w-4xl min-h-[600px] relative"
      >
        {/* Left Side - Branding */}
        <div className="hidden md:flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 blur-3xl -mr-36 -mt-36 rounded-full" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 blur-3xl -ml-36 -mb-36 rounded-full" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-lg"
            >
              <GraduationCap size={28} className="text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl font-serif font-bold text-white tracking-tight leading-tight mb-3">
                Quản lý{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-300">
                  Đào tạo
                </span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed font-light max-w-xs">
                Nền tảng quản lý trung tâm giáo dục toàn diện — từ học viên, lớp học, điểm số đến học phí.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10"
          >
            <div className="flex flex-wrap gap-3">
              {['Quản lý lớp học', 'Theo dõi điểm số', 'Điểm danh', 'Học phí', 'Báo cáo'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-medium text-slate-400 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 md:hidden shadow-lg">
              <GraduationCap size={22} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">EduManage</h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản quản trị'}
            </p>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit(handleAuthSubmit)} 
            className="space-y-4"
          >
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1">Họ và tên</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors z-10" size={18} />
                    <input 
                      {...(reg as any)('name')}
                      type="text" 
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none relative"
                    />
                  </div>
                  {(errors as any).name && <p className="text-[10px] text-red-500 font-medium ml-1">{(errors as any).name.message as string}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors z-10" size={18} />
                <input 
                  {...reg('email')}
                  type="email" 
                  placeholder="admin@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none relative"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.email.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors z-10" size={18} />
                <input 
                  {...reg('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none relative"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.password.message as string}</p>}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-[11px] font-medium text-red-600 bg-red-50/80 backdrop-blur-sm p-3 rounded-xl border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold tracking-wider text-sm py-4 px-6 rounded-2xl hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-200/50 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.98]"
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
          </motion.form>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-xs font-medium text-slate-400"
          >
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-accent font-bold hover:text-accent/80 transition-colors"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
