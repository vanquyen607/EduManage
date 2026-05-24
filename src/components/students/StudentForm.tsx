import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Student, StudentStatus, Class } from '@/src/types';
import { studentService } from '@/src/services/studentService';
import { studentSchema, type StudentFormData } from '@/src/lib/validation';
import { useToast } from '@/src/lib/toast';

interface StudentFormProps {
  classes: Class[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Student;
}

export default function StudentForm({ classes, onSuccess, onCancel, initialData }: StudentFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      birthDate: initialData.birthDate,
      gender: initialData.gender,
      classId: initialData.classId,
      parentName: initialData.parentName,
      parentPhone: initialData.parentPhone,
      parentEmail: initialData.parentEmail || '',
      email: initialData.email || '',
      address: initialData.address || '',
      notes: initialData.notes || '',
    } : {
      name: '',
      birthDate: '',
      gender: 'male',
      classId: classes[0]?.id || '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      email: '',
      address: '',
      notes: '',
    }
  });

  const selectedClassId = watch('classId');

  useEffect(() => {
    if (!initialData && classes.length > 0 && !selectedClassId) {
      setValue('classId', classes[0].id);
    }
  }, [classes, initialData, selectedClassId, setValue]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      if (initialData?.id) {
        await studentService.update(initialData.id, { ...data, status: StudentStatus.ACTIVE });
        toast('Cập nhật học sinh thành công!', 'success');
      } else {
        await studentService.add({ ...data, status: StudentStatus.ACTIVE } as any);
        toast('Thêm học sinh thành công!', 'success');
      }
      onSuccess();
    } catch (error) {
      toast('Có lỗi xảy ra, vui lòng thử lại!', 'error');
    }
  };

  const inputClass = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm";
  const errorClass = "text-[10px] text-red-500 font-medium mt-1";

  return (
    <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Họ và tên</label>
            <input {...register('name')} type="text" className={inputClass} placeholder="Nguyễn Văn A" />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Email học sinh</label>
            <input {...register('email')} type="email" className={inputClass} placeholder="hocsinh@example.com" />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Ngày sinh</label>
            <input {...register('birthDate')} type="date" className={inputClass} />
            {errors.birthDate && <p className={errorClass}>{errors.birthDate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Giới tính</label>
            <select {...register('gender')} className={inputClass}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Lớp đăng ký</label>
          <select {...register('classId')} className={inputClass}>
            <option value="">Chọn lớp học</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.classId && <p className={errorClass}>{errors.classId.message}</p>}
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
           <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest text-[10px]">Thông tin bổ sung</h4>
           <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Địa chỉ thường trú</label>
                <input {...register('address')} type="text" className={inputClass} placeholder="Số nhà, Tên đường, Phường/Xã..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Ghi chú đặc biệt</label>
                <textarea {...register('notes')} rows={2} className={inputClass} placeholder="Tình trạng sức khỏe, đặc điểm học tập..." />
              </div>
           </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
           <h4 className="text-sm font-bold text-slate-900 mb-3">Thông tin phụ huynh</h4>
           <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Họ tên phụ huynh</label>
                <input {...register('parentName')} type="text" className={inputClass} />
                {errors.parentName && <p className={errorClass}>{errors.parentName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Số điện thoại</label>
                  <input {...register('parentPhone')} type="tel" className={inputClass} />
                  {errors.parentPhone && <p className={errorClass}>{errors.parentPhone.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Email</label>
                  <input {...register('parentEmail')} type="email" className={inputClass} />
                  {errors.parentEmail && <p className={errorClass}>{errors.parentEmail.message}</p>}
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-6">
        <button type="button" onClick={onCancel} className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
          Hủy
        </button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-xl transition-all shadow-md flex items-center gap-2">
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          {initialData ? 'Lưu thay đổi' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
}
