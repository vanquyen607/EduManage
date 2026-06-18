import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, GraduationCap, BookOpen, Users, BarChart3 } from 'lucide-react';
import { authSchema, registerSchema } from '@/src/lib/validation';
import { login, register as registerUser } from '@/src/lib/authStore';

function FloatingShape({ className, delay, duration }: { className: string; delay: number; duration: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0.15, 0.3, 0.15],
        scale: [1, 1.15, 1],
        y: [0, -20, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 text-[#a09d96] text-sm group"
    >
      <span className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-coral/20 transition-colors duration-300">
        <Icon size={13} className="text-coral" />
      </span>
      {label}
    </motion.div>
  );
}

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

  useEffect(() => {
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
    <div className="min-h-screen flex bg-canvas">
      {/* Left Panel — Brand / Hero */}
      <div className="hidden lg:flex w-[55%] relative flex-col bg-surface-dark overflow-hidden">
        {/* Ambient gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] -right-16 w-[30rem] h-[30rem] rounded-full bg-coral/10 blur-3xl" />
          <div className="absolute bottom-[5%] -left-24 w-[35rem] h-[35rem] rounded-full bg-accent-amber/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] rounded-full bg-coral/5 blur-3xl" />
        </div>

        {/* Floating decorative shapes */}
        <FloatingShape className="top-[18%] right-[15%] w-4 h-4 rounded-full bg-coral/40" delay={0} duration={6} />
        <FloatingShape className="top-[35%] right-[25%] w-3 h-3 bg-white/10 rotate-45" delay={1.5} duration={5} />
        <FloatingShape className="bottom-[30%] left-[10%] w-5 h-5 rounded-full bg-accent-amber/30" delay={0.8} duration={7} />
        <FloatingShape className="bottom-[20%] right-[20%] w-3 h-3 rounded-full bg-white/15" delay={2} duration={4.5} />
        <FloatingShape className="top-[55%] left-[8%] w-4 h-4 bg-coral/25 rotate-12" delay={2.5} duration={5.5} />

        {/* Animated ring */}
        <motion.div
          className="absolute top-[22%] right-[20%] w-20 h-20 rounded-full border border-coral/15"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-[22%] right-[20%] w-20 h-20 rounded-full border border-white/5"
          animate={{ rotate: -360, scale: [1.05, 1, 1.05] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 flex flex-col h-full px-16 xl:px-20 py-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center shadow-lg shadow-coral/20">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">EduManage</span>
          </motion.div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h1 className="text-[2.75rem] xl:text-[3.25rem] font-serif font-medium text-white leading-[1.08] tracking-tight mb-5">
                Hệ thống quản lý
                <br />
                <span className="text-coral">trung tâm giáo dục</span>
              </h1>
              <p className="text-[#a09d96] text-base xl:text-lg leading-relaxed max-w-md mb-10">
                Quản lý học viên, lớp học, lịch học, điểm số và doanh thu trong cùng một nền tảng duy nhất.
              </p>
            </motion.div>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-3.5"
            >
              <FeatureBadge icon={Users} label="Quản lý học viên & lớp học" />
              <FeatureBadge icon={BookOpen} label="Theo dõi điểm số & chuyên cần" />
              <FeatureBadge icon={BarChart3} label="Báo cáo doanh thu & thống kê" />
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-[#6c6a64] text-xs"
          >
            &copy; {new Date().getFullYear()} EduManage. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen relative">
        {/* Mobile brand header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden absolute top-8 left-0 right-0 text-center"
        >
          <div className="w-11 h-11 bg-coral rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-coral/20">
            <GraduationCap size={21} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">EduManage</h1>
          <p className="text-muted text-sm mt-0.5">Phần mềm quản lý giáo dục</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm mt-16 lg:mt-0"
        >
          <div className="bg-surface-card rounded-xl border border-hairline p-8 sm:p-10 shadow-sm">
            {/* Form header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-[1.5rem] font-serif font-medium text-ink mb-1.5 tracking-tight">
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </h2>
                <p className="text-muted text-sm mb-8">
                  {mode === 'login' ? 'Đăng nhập để quản lý trung tâm của bạn' : 'Đăng ký tài khoản quản trị mới'}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit(handleAuthSubmit)} className="space-y-5">
              {/* Name field — register only */}
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="name" className="block text-sm font-medium text-body mb-1.5">Họ và tên</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none" />
                      <input
                        {...(reg as any)('name')}
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Nguyễn Văn A"
                        className="w-full h-11 pl-10 pr-4 bg-canvas border border-hairline rounded-lg text-sm text-body placeholder:text-muted-soft/50 focus:border-coral focus:ring-[3px] focus:ring-coral/12 outline-none transition-all duration-200"
                      />
                    </div>
                    {(errors as any).name && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                        {(errors as any).name.message as string}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-body mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none" />
                  <input
                    {...reg('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className="w-full h-11 pl-10 pr-4 bg-canvas border border-hairline rounded-lg text-sm text-body placeholder:text-muted-soft/50 focus:border-coral focus:ring-[3px] focus:ring-coral/12 outline-none transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {errors.email.message as string}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-body mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none" />
                  <input
                    {...reg('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-canvas border border-hairline rounded-lg text-sm text-body placeholder:text-muted-soft/50 focus:border-coral focus:ring-[3px] focus:ring-coral/12 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-soft hover:text-body transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {errors.password.message as string}
                  </p>
                )}
              </div>

              {/* Remember me */}
              {mode === 'login' && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-hairline text-coral focus:ring-coral/20 focus:ring-offset-0 cursor-pointer transition-all"
                  />
                  <span className="text-sm text-muted group-hover:text-body transition-colors">Ghi nhớ đăng nhập</span>
                </label>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-lg p-3.5">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-11 bg-coral text-white text-sm font-medium rounded-lg hover:bg-coral-active transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] overflow-hidden group"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-8 pt-6 border-t border-hairline text-center">
              <p className="text-sm text-muted">
                {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              </p>
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="mt-1.5 font-medium text-sm text-coral hover:text-coral-active transition-colors"
              >
                {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
