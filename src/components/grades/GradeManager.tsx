import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ChevronRight, 
  Star,
  TrendingUp,
  FileText
} from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  deleteDoc, 
  doc, 
  where,
  updateDoc 
} from 'firebase/firestore';
import { Student, Class, Grade } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import Modal from '@/src/components/ui/Modal';

export default function GradeManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [newGrade, setNewGrade] = useState<Partial<Grade>>({
    subject: 'Tiếng Anh',
    weight: 1,
    date: new Date().toISOString().split('T')[0]
  });

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    setNewGrade({ subject: 'Tiếng Anh', weight: 1, date: new Date().toISOString().split('T')[0] });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (grade: Grade) => {
    setEditingGrade(grade);
    setNewGrade({
      studentId: grade.studentId,
      subject: grade.subject,
      score: grade.score,
      weight: grade.weight,
      date: grade.date
    });
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    const qGrades = query(collection(db, 'grades'));
    const qStudents = query(collection(db, 'students'));
    const qClasses = query(collection(db, 'classes'));

    const unsubGrades = onSnapshot(qGrades, (snap) => {
      setGrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Grade)));
      setLoading(false);
    });
    
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    });

    const unsubClasses = onSnapshot(qClasses, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
    });

    return () => {
      unsubGrades();
      unsubStudents();
      unsubClasses();
    };
  }, []);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade.studentId || newGrade.score === undefined) return;

    const student = students.find(s => s.id === newGrade.studentId);
    
    const gradeData = {
      ...newGrade,
      classId: student?.classId || '',
      score: Number(newGrade.score)
    };

    if (editingGrade) {
      await updateDoc(doc(db, 'grades', editingGrade.id), gradeData);
    } else {
      await addDoc(collection(db, 'grades'), gradeData);
    }

    setIsAddModalOpen(false);
    setNewGrade({ subject: 'Tiếng Anh', weight: 1, date: new Date().toISOString().split('T')[0] });
    setEditingGrade(null);
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'grades', id));
    } catch (error) {
      console.error("Error deleting grade:", error);
      alert("Có lỗi xảy ra khi xóa điểm.");
    }
  };

  const filteredGrades = grades.filter(g => {
    const student = students.find(s => s.id === g.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassId === 'all' || g.classId === selectedClassId;
    return matchesSearch && matchesClass;
  });

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
          <h1 className="text-3xl font-serif font-bold text-slate-900">Quản lý Điểm</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi kết quả học tập của học viên</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
        >
          <Plus size={16} />
          <span>NHẬP ĐIỂM MỚI</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-4">Bộ lọc lớp học</p>
             <div className="space-y-2">
                <button 
                  onClick={() => setSelectedClassId('all')}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all",
                    selectedClassId === 'all' ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
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
                      selectedClassId === cls.id ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    {cls.name}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
            <div className="p-4 border-b border-slate-50 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm tên học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                />
              </div>
            </div>

            <div className="md:hidden divide-y divide-slate-50">
              {filteredGrades.map((g) => {
                const student = students.find(s => s.id === g.studentId);
                return (
                  <div key={g.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">{student?.name || '---'}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{classes.find(c => c.id === g.classId)?.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEditModal(g)} className="p-2 text-slate-300 hover:text-primary transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteGrade(g.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest",
                            g.weight === 4 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {getWeightLabel(g.weight)}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">{g.subject}</span>
                       </div>
                       <span className={cn(
                          "text-xl font-serif font-black",
                          g.score >= 8 ? "text-emerald-600" : g.score < 5 ? "text-red-500" : "text-slate-900"
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
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học viên</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Môn học</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại điểm</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm số</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredGrades.map((g) => {
                    const student = students.find(s => s.id === g.studentId);
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{student?.name || '---'}</p>
                          <p className="text-[10px] text-slate-500">{classes.find(c => c.id === g.classId)?.name}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{g.subject}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest",
                            g.weight === 4 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {getWeightLabel(g.weight)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-base font-serif font-black",
                            g.score >= 8 ? "text-emerald-600" : g.score < 5 ? "text-red-500" : "text-slate-900"
                          )}>
                            {g.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => handleOpenEditModal(g)}
                              className="p-2 text-slate-300 hover:text-primary transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteGrade(g.id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
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
                           <div className="p-4 bg-slate-50 rounded-full">
                             <FileText size={32} className="text-slate-300" />
                           </div>
                           <p className="text-sm font-medium text-slate-400">Chưa có dữ liệu điểm</p>
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
        <form onSubmit={handleAddGrade} className="space-y-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Dành cho học sinh</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
              value={newGrade.studentId || ''}
              onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
            >
              <option value="">Chọn học sinh</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {classes.find(c => c.id === s.classId)?.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Môn học</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                value={newGrade.subject}
                onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Điểm số</label>
              <input 
                type="number" 
                required
                step="0.1"
                min="0"
                max="10"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-serif font-bold"
                value={newGrade.score || ''}
                onChange={(e) => setNewGrade({ ...newGrade, score: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Loại điểm</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                value={newGrade.weight}
                onChange={(e) => setNewGrade({ ...newGrade, weight: Number(e.target.value) })}
              >
                <option value={1}>Thường xuyên</option>
                <option value={2}>15 phút</option>
                <option value={3}>Giữa kỳ</option>
                <option value={4}>Cuối kỳ</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Ngày nhập</label>
              <input 
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                value={newGrade.date}
                onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
               type="button"
               onClick={() => setIsAddModalOpen(false)}
               className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-slate-200 transition-all font-sans"
             >
               HỦY BỎ
             </button>
             <button 
               type="submit"
               className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-sans"
             >
               LƯU KẾT QUẢ
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
