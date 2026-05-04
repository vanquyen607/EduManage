import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, DollarSign } from 'lucide-react';
import { classService } from '@/src/services/classService';
import { Class } from '@/src/types';
import { formatCurrency } from '@/src/lib/utils';
import Modal from '@/src/components/ui/Modal';
import ClassForm from './ClassForm';

export default function ClassList() {
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
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Chương trình đào tạo</p>
          </div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Quản lý Lớp học</h2>
          <p className="text-slate-500 text-sm mt-1">Thiết lập danh mục lớp và mức học phí chi tiết.</p>
        </div>
        <button 
          onClick={() => { setSelectedClass(undefined); setIsModalOpen(true); }}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
         motion-layout
        >
          <Plus size={14} />
          THÊM LỚP MỚI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
          ))
        ) : classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-1.5 w-full bg-slate-100" style={{ backgroundColor: cls.color || '#3b82f6' }} />
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                  <GraduationCap size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => { setSelectedClass(cls); setIsModalOpen(true); }} 
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cls.id)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2 truncate group-hover:text-primary transition-colors">{cls.name}</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 line-clamp-2 italic">"{cls.description || 'Không có mô tả chi tiết.'}"</p>
              
              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mức học phí</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{formatCurrency(cls.feePerSession)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">/ BUỔI</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-45">
                   <Plus size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
               <GraduationCap size={24} />
             </div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chưa có chương trình đào tạo nào</p>
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
