import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, DollarSign } from 'lucide-react';
import { classService } from '@/src/services/classService';
import { Class } from '@/src/types';
import { formatCurrency } from '@/src/lib/utils';
import Modal from '@/src/components/ui/Modal';
import ClassForm from './ClassForm';
import { useToast } from '@/src/lib/toast';

export default function ClassList() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await classService.getAll();
    setClasses(data);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await classService.delete(id);
      toast('Đã xóa lớp học!', 'success');
      fetchData();
    } catch (err) {
      toast('Có lỗi khi xóa lớp học!', 'error');
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Chương trình đào tạo</p>
          </div>
          <h2 className="text-4xl  font-bold text-ink tracking-tight">Quản lý Lớp học</h2>
          <p className="text-muted text-sm mt-1">Thiết lập danh mục lớp và mức học phí chi tiết.</p>
        </div>
        <button 
          onClick={() => { setSelectedClass(undefined); setIsModalOpen(true); }}
          className="bg-coral text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-coral/20 hover:bg-coral-active transition-all active:scale-95"
         motion-layout="true"
        >
          <Plus size={14} />
          THÊM LỚP MỚI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-accent-light border border-hairline rounded-xl animate-pulse" />
          ))
        ) : classes.map((cls) => (
          <div key={cls.id} className="bg-card rounded-xl border border-hairline shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-1.5 w-full bg-hairline/50" style={{ backgroundColor: cls.color || '#3b82f6' }} />
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3.5 bg-surface-dark text-white rounded-xl shadow-lg">
                  <GraduationCap size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => { setSelectedClass(cls); setIsModalOpen(true); }} 
                    className="p-2 text-muted hover:text-coral hover:bg-accent-light rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cls.id)} 
                    className="p-2 text-muted hover:text-red-500 hover:bg-accent-light rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className=" text-2xl font-bold text-ink mb-2 truncate group-hover:text-coral transition-colors">{cls.name}</h3>
              <p className="text-muted text-xs font-medium leading-relaxed mb-6 line-clamp-2 italic">"{cls.description || 'Không có mô tả chi tiết.'}"</p>
              
              <div className="pt-6 border-t border-hairline flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Mức học phí</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-ink">{formatCurrency(cls.feePerSession)}</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-tighter">/ BUỔI</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted-soft group-hover:bg-coral group-hover:text-white transition-all transform group-hover:rotate-45">
                   <Plus size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-hairline rounded-xl">
             <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline text-muted-soft">
               <GraduationCap size={24} />
             </div>
             <p className="text-[11px] font-black text-muted uppercase tracking-widest">Chưa có chương trình đào tạo nào</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedClass ? "Sửa lớp học" : "Tạo lớp học mới"}
      >
        <ClassForm 
          initialData={selectedClass} 
          onCancel={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
        />
      </Modal>
    </div>
  );
}
