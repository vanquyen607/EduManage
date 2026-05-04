import React, { useState, useEffect } from 'react';
import { Student, StudentStatus, Class } from '@/src/types';
import { studentService } from '@/src/services/studentService';

interface StudentFormProps {
  classes: Class[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Student;
}

export default function StudentForm({ classes, onSuccess, onCancel, initialData }: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<Student>>(
    initialData || {
      name: '',
      birthDate: '',
      gender: 'male',
      classId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      status: StudentStatus.ACTIVE
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure classId is selected if creating new student
  useEffect(() => {
    if (!initialData && classes.length > 0 && !formData.classId) {
      setFormData(prev => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, initialData, formData.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (initialData?.id) {
        await studentService.update(initialData.id, formData);
      } else {
        await studentService.add(formData as Omit<Student, 'id' | 'createdAt'>);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Họ và tên</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Email học sinh</label>
            <input 
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="hocsinh@example.com"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Ngày sinh</label>
            <input 
              required
              type="date"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              value={formData.birthDate}
              onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Giới tính</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Lớp đăng ký</label>
          <select 
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            value={formData.classId}
            onChange={e => setFormData({ ...formData, classId: e.target.value })}
          >
            <option value="">Chọn lớp học</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
           <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest text-[10px]">Thông tin bổ sung</h4>
           <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Địa chỉ thường trú</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, Tên đường, Phường/Xã..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Ghi chú đặc biệt</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tình trạng sức khỏe, đặc điểm học tập..."
                />
              </div>
           </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
           <h4 className="text-sm font-bold text-slate-900 mb-3">Thông tin phụ huynh</h4>
           <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Họ tên phụ huynh</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  value={formData.parentName}
                  onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Số điện thoại</label>
                  <input 
                    required
                    type="tel"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={formData.parentPhone}
                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    value={formData.parentEmail}
                    onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                  />
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-6">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
        >
          Hủy
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          {initialData ? 'Lưu thay đổi' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
}
