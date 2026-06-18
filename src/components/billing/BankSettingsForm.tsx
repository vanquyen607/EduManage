import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Info, Landmark } from 'lucide-react';
import { settingsService } from '@/src/services/settingsService';
import { bankSettingsSchema, type BankSettingsFormData } from '@/src/lib/validation';
import { useToast } from '@/src/lib/toast';

export default function BankSettingsForm() {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BankSettingsFormData>({
    resolver: zodResolver(bankSettingsSchema),
    defaultValues: {
      name: '',
      accountNumber: '',
      accountName: '',
      shortName: 'mbbank'
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsService.getBankSettings();
        reset(data);
      } catch (error) {
        toast('Không thể tải cấu hình ngân hàng!', 'error');
      }
    };
    loadSettings();
  }, [reset, toast]);

  const onSubmit = async (data: BankSettingsFormData) => {
    try {
      await settingsService.saveBankSettings({
        ...data,
        shortName: data.shortName.toLowerCase().trim()
      });
      toast('Đã lưu cấu hình ngân hàng thành công!', 'success');
    } catch (error) {
      toast('Lỗi khi lưu cấu hình. Vui lòng thử lại.', 'error');
    }
  };

  return (
    <div className="bg-card rounded-xl border border-hairline shadow-sm overflow-hidden">
      <div className="p-6 border-b border-hairline flex items-center justify-between bg-accent-light/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Cấu hình Ngân hàng</h3>
            <p className="text-xs text-muted font-medium">Thông tin hiển thị cho phụ huynh khi thanh toán</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Tên Ngân hàng</label>
            <input {...register('name')} type="text" placeholder="VD: MB BANK, Vietcombank..." className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none transition-all text-sm font-semibold" />
            {errors.name && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Mã định danh (Short Name)</label>
            <div className="relative">
              <input {...register('shortName')} type="text" placeholder="VD: mbbank, vcb, icb..." className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none transition-all text-sm font-semibold pr-10" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none" title="Mã theo tiêu chuẩn VietQR (như vcb, mbbank, bidv, tcb...)">
                <Info size={16} />
              </div>
            </div>
            {errors.shortName && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.shortName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Số tài khoản</label>
            <input {...register('accountNumber')} type="text" placeholder="Nhập số tài khoản thật" className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none transition-all text-sm font-semibold font-mono font-bold text-coral" />
            {errors.accountNumber && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.accountNumber.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">Tên chủ tài khoản</label>
            <input {...register('accountName')} type="text" placeholder="Tên in trên thẻ (không dấu)" className="w-full p-3 rounded-xl border border-hairline focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none transition-all text-sm font-semibold font-bold uppercase" />
            {errors.accountName && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.accountName.message}</p>}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-coral text-white rounded-xl text-sm font-bold shadow-lg shadow-coral/20 transition-all active:scale-95 hover:bg-coral/90 disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
}
