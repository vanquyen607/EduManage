import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Star,
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';
import { api } from '@/src/lib/api';
import { Student, Class, Grade } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import Modal from '@/src/components/ui/Modal';
import { TableSkeleton } from '@/src/components/ui/Skeleton';
import Pagination, { usePagination } from '@/src/components/ui/Pagination';
import { exportToExcel, exportToCSV } from '@/src/lib/exportUtils';
import { gradeSchema, type GradeFormData } from '@/src/lib/validation';
import { useToast } from '@/src/lib/toast';

export default function GradeManager() {
  const { toast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      studentId: '',
      subject: 'Tiếng Anh',
      score: undefined as any,
      weight: 1,
      date: new Date().toISOString().split('T')[0]
    }
  });

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    reset({ studentId: '', subject: 'Tiếng Anh', score: undefined as any, weight: 1, date: new Date().toISOString().split('T')[0] });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (grade: Grade) => {
    setEditingGrade(grade);
    reset({
      studentId: grade.studentId,
      subject: grade.subject,
      score: grade.score,
      weight: grade.weight,
      date: grade.date
    });
    setIsAddModalOpen(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gData, sData, cData] = await Promise.all([
        api.getGrades(),
        api.getStudents(),
        api.getClasses(),
      ]);
      setGrades(gData.map((d: any) => ({
        id: d.id,
        studentId: d.student_id,
        classId: d.class_id,
        subject: d.subject,
        score: d.score,
        weight: d.weight,
        date: d.date || '',
        ownerId: d.owner_id,
        note: d.note || '',
      })));
      setStudents(sData.map((d: any) => ({
        id: d.id,
        name: d.name,
        birthDate: d.birth_date || '',
        gender: d.gender || 'other',
        classId: d.class_id || '',
        parentName: d.parent_name || '',
        parentPhone: d.parent_phone || '',
        parentEmail: d.parent_email || '',
        email: d.email || '',
        phone: d.phone || '',
        address: d.address || '',
        notes: d.notes || '',
        status: d.status,
        ownerId: d.owner_id,
        joinDate: d.join_date || '',
        createdAt: d.created_at || '',
      })));
      setClasses(cData.map((d: any) => ({
        id: d.id,
        name: d.name,
        teacher: d.teacher || '',
        feePerSession: d.fee_per_session || 0,
        description: d.description || '',
        color: d.color || '#6366f1',
        ownerId: d.owner_id,
        schedule: Array.isArray(d.schedule) ? d.schedule : [],
      })));
    } catch {
      toast('Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onGradeSubmit = async (data: GradeFormData) => {
    const student = students.find(s => s.id === data.studentId);
    const gradeData = { ...data, classId: student?.classId || '' };

    try {
      if (editingGrade) {
        await api.updateGrade(editingGrade.id, gradeData);
        toast('Cập nhật điểm thành công!', 'success');
      } else {
        await api.addGrade(gradeData);
        toast('Thêm điểm thành công!', 'success');
      }
      setIsAddModalOpen(false);
      setEditingGrade(null);
      fetchData();
    } catch {
      toast('Có lỗi xảy ra khi lưu điểm!', 'error');
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      await api.deleteGrade(id);
      toast('Đã xóa điểm!', 'success');
      fetchData();
    } catch {
      toast('Có lỗi xảy ra khi xóa điểm!', 'error');
    }
  };

  const filteredGrades = grades.filter(g => {
    const student = students.find(s => s.id === g.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassId === 'all' || g.classId === selectedClassId;
    return matchesSearch && matchesClass;
  });

  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination<Grade>(filteredGrades, 10);

  const handleExportExcel = () => {
    const data = filteredGrades.map(g => {
      const student = students.find(s => s.id === g.studentId);
      return {
        'Học sinh': student?.name || '---',
        'Lớp': classes.find(c => c.id === g.classId)?.name || '---',
        'Môn học': g.subject,
        'Điểm': g.score,
        'Loại điểm': getWeightLabel(g.weight),
        'Ngày nhập': g.date
      };
    });
    exportToExcel(data, 'danh-sach-diem');
    toast('Xuất Excel thành công!', 'success');
  };

  const getWeightLabel = (w: number) => {
    switch (w) {
      case 1: return 'TX';
      case 2: return '15P';
      case 3: return 'Giữa kỳ';
      case 4: return 'Cuối kỳ';
      default: return 'Khác';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl  font-bold text-ink">Quản lý Điểm</h1>
          <p className="text-muted text-sm mt-1">Theo dõi kết quả học tập của học viên</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="bg-card border border-hairline text-muted px-6 py-3 rounded-xl font-semibold text-xs tracking-widest uppercase hover:border-ink transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Download size={16} />
            <span>XUẤT EXCEL</span>
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="bg-coral text-white px-6 py-3 rounded-xl font-semibold text-xs tracking-widest uppercase hover:bg-coral-active transition-all flex items-center gap-2 shadow-lg shadow-coral/20 active:scale-95"
          >
            <Plus size={16} />
            <span>NHẬP ĐIỂM MỚI</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-xl border border-hairline shadow-sm">
             <p className="text-[10px] font-semibold text-muted uppercase tracking-tighter mb-4">Bộ lọc lớp học</p>
             <div className="space-y-2">
                <button 
                  onClick={() => setSelectedClassId('all')}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all",
                    selectedClassId === 'all' ? "bg-coral text-white" : "hover:bg-accent-light text-muted"
                  )}
                >
                  Tất cả lớp
                </button>
                {classes.map(cls => (
                  <button 
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all truncate",
                      selectedClassId === cls.id ? "bg-surface-dark text-white" : "hover:bg-accent-light text-muted"
                    )}
                  >
                    {cls.name}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-card rounded-xl border border-hairline shadow-sm overflow-hidden p-2">
            <div className="p-4 border-b border-hairline flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm tên học sinh..."
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-accent-light rounded-xl text-sm border-none focus:ring-2 focus:ring-coral/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="md:hidden divide-y divide-hairline">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 animate-pulse space-y-3">
                    <div className="h-4 bg-hairline/50 rounded w-1/2" />
                    <div className="h-4 bg-accent-light rounded w-full" />
                  </div>
                ))
              ) : paginatedItems.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="p-4 bg-accent-light rounded-full w-fit mx-auto mb-3">
                    <FileText size={24} className="text-muted-soft" />
                  </div>
                  <p className="text-xs font-bold text-muted">Không có dữ liệu</p>
                </div>
              ) : paginatedItems.map((g) => {
                const student = students.find(s => s.id === g.studentId);
                return (
                  <div key={g.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">{student?.name || '---'}</p>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-tight">{classes.find(c => c.id === g.classId)?.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEditModal(g)} className="p-2 text-muted-soft hover:text-coral transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteGrade(g.id)} className="p-2 text-muted-soft hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest",
                            g.weight === 4 ? "bg-amber-100 text-amber-600" : "bg-hairline/50 text-muted"
                          )}>
                            {getWeightLabel(g.weight)}
                          </span>
                          <span className="text-[10px] font-medium text-muted">{g.subject}</span>
                       </div>
                       <span className={cn(
                          "text-xl  font-semibold",
                          g.score >= 8 ? "text-emerald-600" : g.score < 5 ? "text-red-500" : "text-ink"
                        )}>
                          {g.score}
                        </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-widest">Học viên</th>
                    <th className="px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-widest">Môn học</th>
                    <th className="px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-widest">Loại điểm</th>
                    <th className="px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-widest">Điểm số</th>
                    <th className="px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-widest">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredGrades.map((g) => {
                    const student = students.find(s => s.id === g.studentId);
                    return (
                      <tr key={g.id} className="hover:bg-accent-light/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-ink">{student?.name || '---'}</p>
                          <p className="text-[10px] text-muted">{classes.find(c => c.id === g.classId)?.name}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-muted">{g.subject}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest",
                            g.weight === 4 ? "bg-amber-100 text-amber-600" : "bg-hairline/50 text-muted"
                          )}>
                            {getWeightLabel(g.weight)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-base  font-semibold",
                            g.score >= 8 ? "text-emerald-600" : g.score < 5 ? "text-red-500" : "text-ink"
                          )}>
                            {g.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => handleOpenEditModal(g)}
                              className="p-2 text-muted-soft hover:text-coral transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteGrade(g.id)}
                              className="p-2 text-muted-soft hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredGrades.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <div className="p-4 bg-accent-light rounded-full">
                             <FileText size={32} className="text-muted-soft" />
                           </div>
                           <p className="text-sm font-medium text-muted">Chưa có dữ liệu điểm</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={editingGrade ? "Chỉnh sửa điểm" : "Nhập điểm học tập"}
      >
        <form onSubmit={handleSubmit(onGradeSubmit)} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2 block">Dành cho học sinh</label>
            <select 
              {...register('studentId')}
              className="w-full bg-accent-light border border-hairline rounded-xl px-4 py-3 text-sm"
            >
              <option value="">Chọn học sinh</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {classes.find(c => c.id === s.classId)?.name}</option>
              ))}
            </select>
            {errors.studentId && <p className="text-[10px] text-red-500 mt-1">{errors.studentId.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2 block">Môn học</label>
              <input {...register('subject')} type="text" className="w-full bg-accent-light border border-hairline rounded-xl px-4 py-3 text-sm" />
              {errors.subject && <p className="text-[10px] text-red-500 mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2 block">Điểm số</label>
              <input {...register('score', { valueAsNumber: true })} type="number" step="0.1" className="w-full bg-accent-light border border-hairline rounded-xl px-4 py-3 text-sm  font-bold" />
              {errors.score && <p className="text-[10px] text-red-500 mt-1">{errors.score.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2 block">Loại điểm</label>
              <select {...register('weight', { valueAsNumber: true })} className="w-full bg-accent-light border border-hairline rounded-xl px-4 py-3 text-sm">
                <option value={1}>Thường xuyên</option>
                <option value={2}>15 phút</option>
                <option value={3}>Giữa kỳ</option>
                <option value={4}>Cuối kỳ</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2 block">Ngày nhập</label>
              <input {...register('date')} type="date" className="w-full bg-accent-light border border-hairline rounded-xl px-4 py-3 text-sm" />
              {errors.date && <p className="text-[10px] text-red-500 mt-1">{errors.date.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-card border border-hairline text-muted rounded-xl text-[10px] font-semibold tracking-widest uppercase hover:bg-accent-light transition-all">
               HỦY BỎ
             </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-coral text-white rounded-xl text-[10px] font-semibold tracking-widest uppercase hover:bg-coral-active transition-all shadow-lg shadow-coral/20 active:scale-95 ">
               LƯU KẾT QUẢ
             </button>
          </div>
        </form>
      </Modal>
      {filteredGrades.length > 10 && !loading && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
