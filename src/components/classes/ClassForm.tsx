import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Class } from '@/src/types';
import { classService } from '@/src/services/classService';
import { classSchema, type ClassFormData } from '@/src/lib/validation';
import { useToast } from '@/src/lib/toast';

interface ClassFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Class;
}

export default function ClassForm({ onSuccess, onCancel, initialData }: ClassFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      feePerSession: initialData.feePerSession,
      description: initialData.description || '',
      color: initialData.color,
    } : {
      name: '',
      feePerSession: 0,
      description: '',
      color: '#3b82f6',
    }
  });

  const onSubmit = async (data: ClassFormData) => {
    try {
      if (initialData?.id) {
        await classService.update(initialData.id, data);
        toast('Cập nhật lớp học thành công!', 'success');
      } else {
        await classService.add(data as any);
        toast('Thêm lớp học thành công!', 'success');
      }
      onSuccess();
    } catch (error) {
      toast('Có lỗi xảy ra, vui lòng thử lại!', 'error');
    }
  };

  const inputClass = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm";
  const errorClass = "text-[10px] text-red-500 font-medium mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên lớp học</label>
        <input {...register('name')} type="text" className={inputClass} placeholder="Ví dụ: Lớp Toán Nâng Cao" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Học phí mỗi buổi (VND)</label>
        <input {...register('feePerSession', { valueAsNumber: true })} type="number" className={inputClass} />
        {errors.feePerSession && <p className={errorClass}>{errors.feePerSession.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Màu sắc định danh</label>
        <input {...register('color')} type="color" className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
        {errors.color && <p className={errorClass}>{errors.color.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả</label>
        <textarea {...register('description')} rows={3} className={inputClass} />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Hủy</button>
        <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
          {initialData ? 'Cập nhật' : 'Thêm lớp'}
        </button>
      </div>
    </form>
  );
}
