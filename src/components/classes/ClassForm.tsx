import React, { useState } from 'react';
import { Class } from '@/src/types';
import { classService } from '@/src/services/classService';

interface ClassFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Class;
}

export default function ClassForm({ onSuccess, onCancel, initialData }: ClassFormProps) {
  const [formData, setFormData] = useState<Partial<Class>>(
    initialData || {
      name: '',
      feePerSession: 0,
      description: '',
      color: '#3b82f6'
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await classService.update(initialData.id, formData);
      } else {
        await classService.add(formData as Omit<Class, 'id'>);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên lớp học</label>
        <input 
          required
          type="text"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ví dụ: Lớp Toán Nâng Cao"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Học phí mỗi buổi (VND)</label>
        <input 
          required
          type="number"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          value={formData.feePerSession ?? 0}
          onChange={e => setFormData({ ...formData, feePerSession: Number(e.target.value) })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Màu sắc định danh</label>
        <input 
          type="color"
          className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          value={formData.color || '#3b82f6'}
          onChange={e => setFormData({ ...formData, color: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả</label>
        <textarea 
          rows={3}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          value={formData.description || ''}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Hủy</button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          {initialData ? 'Cập nhật' : 'Thêm lớp'}
        </button>
      </div>
    </form>
  );
}
