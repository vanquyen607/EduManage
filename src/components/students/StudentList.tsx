import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Trash2,
  Edit2,
  FileText,
  Download,
  MessageSquare,
  Star,
  FileBarChart
} from 'lucide-react';
import { motion } from 'motion/react';
import { studentService } from '@/src/services/studentService';
import { classService } from '@/src/services/classService';
import { commentService } from '@/src/services/commentService';
import { Student, Class, StudentStatus, Comment } from '@/src/types';
import { cn } from '@/src/lib/utils';
import Modal from '@/src/components/ui/Modal';
import StudentForm from './StudentForm';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { addVietnameseFont } from '@/src/lib/pdfFonts';
import Pagination, { usePagination } from '@/src/components/ui/Pagination';
import { exportToExcel } from '@/src/lib/exportUtils';
import { useToast } from '@/src/lib/toast';

export default function StudentList() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentingStudent, setCommentingStudent] = useState<Student | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commentRating, setCommentRating] = useState(5);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStudent, setReportStudent] = useState<Student | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sData, cData, comData] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
        commentService.getAll()
      ]);
      setStudents(sData);
      setClasses(cData);
      setComments(comData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedStudent(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingStudentId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingStudentId) return;
    try {
      await studentService.delete(deletingStudentId);
      toast('Đã xóa học sinh!', 'success');
      setIsDeleteConfirmOpen(false);
      setDeletingStudentId(null);
      fetchData();
    } catch (err) {
      toast('Có lỗi khi xóa học sinh!', 'error');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentingStudent) return;
    
    await commentService.add({
      studentId: commentingStudent.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      content: commentContent,
      rating: commentRating
    });
    
    setIsCommentModalOpen(false);
    setCommentContent('');
    setCommentRating(5);
    fetchData(); // Refresh to include new comment in reports
    console.log('Comment saved successfully');
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    const fontName = addVietnameseFont(doc);
    
    if (fontName) {
      doc.setFont(fontName, 'normal');
    }
    
    doc.setFontSize(18);
    doc.text("DANH SÁCH HỌC SINH", 14, 15);
    
    const tableData = filteredStudents.map(s => [
      s.name, 
      classes.find(c => c.id === s.classId)?.name || 'N/A', 
      s.parentName, 
      s.parentPhone, 
      s.status === StudentStatus.ACTIVE ? 'Đang học' : 'Nghỉ học'
    ]);
    
    autoTable(doc, {
      head: [['Tên học sinh', 'Lớp', 'Phụ huynh', 'SĐT', 'Trạng thái']],
      body: tableData,
      startY: 25,
      styles: { 
        font: fontName || 'helvetica', 
        fontStyle: 'normal',
        fontSize: 10
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        font: fontName || 'helvetica',
        fontStyle: 'normal'
      },
      theme: 'grid'
    });
    
    doc.save("danh-sach-hoc-sinh.pdf");
  };

  const exportStudentReport = async (student: Student) => {
    const doc = new jsPDF();
    const fontName = addVietnameseFont(doc);
    
    if (fontName) {
      doc.setFont(fontName, 'normal');
    }
    
    const studentComments = comments.filter(c => c.studentId === student.id);
    const className = classes.find(c => c.id === student.classId)?.name || 'N/A';
    
    doc.setFontSize(22);
    doc.text("BÁO CÁO TIẾN ĐỘ HỌC TẬP", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Học sinh: ${student.name}`, 14, 40);
    doc.text(`Lớp: ${className}`, 14, 47);
    doc.text(`Ngày sinh: ${student.birthDate}`, 14, 54);
    doc.text(`Phụ huynh: ${student.parentName}`, 14, 61);
    
    doc.setFontSize(16);
    doc.text("LỊCH SỬ NHẬN XÉT", 14, 80);
    
    const commentData = studentComments.map(c => [
      `Tháng ${c.month}/${c.year}`,
      `${c.rating}/5 sao`,
      c.content
    ]);
    
    autoTable(doc, {
      head: [['Thời gian', 'Đánh giá', 'Nội dung']],
      body: commentData,
      startY: 85,
      styles: { 
        font: fontName || 'helvetica', 
        fontStyle: 'normal',
        fontSize: 10
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        font: fontName || 'helvetica',
        fontStyle: 'normal'
      },
      theme: 'grid'
    });
    
    doc.save(`bao-cao-${student.name.toLowerCase().replace(/\s/g, '-')}.pdf`);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.parentPhone?.includes(searchQuery);
    const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination<Student>(filteredStudents, 8);

  const handleExportExcel = () => {
    const data = paginatedItems.map(s => ({
      'Học sinh': s.name,
      'Ngày sinh': s.birthDate,
      'Lớp': classes.find(c => c.id === s.classId)?.name || 'N/A',
      'Phụ huynh': s.parentName,
      'SĐT': s.parentPhone,
      'Trạng thái': s.status === StudentStatus.ACTIVE ? 'Đang học' : 'Nghỉ học'
    }));
    exportToExcel(data, 'danh-sach-hoc-sinh');
    toast('Xuất Excel thành công!', 'success');
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Dữ liệu học viên</p>
          </div>
          <h2 className="text-4xl  font-bold text-ink tracking-tight">Danh sách Học sinh</h2>
          <p className="text-muted text-sm mt-1">Hệ thống quản lý thông tin và theo dõi tiến độ đào tạo.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="group px-6 py-3 bg-card border border-hairline text-ink rounded-xl text-[10px] font-black tracking-widest uppercase hover:border-slate-800 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <Download size={14} />
            XUẤT EXCEL
          </button>
          <button 
            onClick={exportPDF}
            className="group px-6 py-3 bg-card border border-hairline text-ink rounded-xl text-[10px] font-black tracking-widest uppercase hover:border-slate-800 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <Download size={14} />
            XUẤT PDF
          </button>
          <button 
            id="add-student-btn"
            onClick={handleAdd}
            className="group px-6 py-3 bg-coral text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-coral-active transition-all flex items-center gap-2 shadow-lg shadow-coral/20 active:scale-95"
          >
            <Plus size={14} />
            THÊM HỌC SINH
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border border-hairline shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
          <input 
            type="text"
            id="student-search"
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            className="w-full pl-12 pr-4 py-3.5 bg-accent-light border border-transparent rounded-xl focus:bg-white focus:border-hairline focus:outline-none focus:ring-4 focus:ring-slate-50 transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={16} />
            <select 
              id="class-filter"
              className="w-full pl-12 pr-10 py-3.5 bg-accent-light border border-transparent rounded-xl focus:bg-white focus:border-hairline focus:outline-none focus:ring-4 focus:ring-slate-50 transition-all appearance-none text-[11px] font-black tracking-widest uppercase cursor-pointer"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">TẤT CẢ LỚP HỌC</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
               <svg size={16} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-hairline overflow-hidden shadow-sm">
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-6 animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-hairline/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-hairline/50 rounded" />
                  <div className="h-3 w-20 bg-accent-light rounded" />
                </div>
              </div>
            ))
          ) : paginatedItems.map((student, idx) => (
            <div key={student.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-dark flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{student.name}</p>
                    <div className="inline-flex items-center gap-2 bg-hairline/50 px-2 py-1 rounded-full mt-1">
                      <span className="text-[9px] font-black text-muted uppercase tracking-tighter">
                        {classes.find(c => c.id === student.classId)?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-ink">{student.parentName}</p>
                  <p className="text-[10px] font-mono text-muted">{student.parentPhone}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex gap-1">
                  <button onClick={() => { setReportStudent(student); setIsReportModalOpen(true); }} className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl"><FileBarChart size={18} /></button>
                  <button onClick={() => { setCommentingStudent(student); setIsCommentModalOpen(true); }} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><MessageSquare size={18} /></button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(student)} className="p-2.5 bg-accent-light text-muted rounded-xl"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(student.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-accent-light/50 border-b border-hairline">
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Học sinh</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Lớp học</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Phụ huynh</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-10">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-hairline/50" />
                          <div className="space-y-2">
                             <div className="h-4 w-32 bg-hairline/50 rounded" />
                             <div className="h-3 w-20 bg-accent-light rounded" />
                          </div>
                       </div>
                    </td>
                  </tr>
                ))
              ) : paginatedItems.map((student, idx) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-accent-light/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-dark flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-ink">{student.name}</p>
                        <p className="text-[10px] font-black text-muted uppercase mt-0.5 tracking-tighter italic">{student.birthDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 bg-hairline/50 px-3 py-1.5 rounded-full border border-hairline/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                        {classes.find(c => c.id === student.classId)?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-ink">{student.parentName}</p>
                    <p className="text-xs font-mono text-muted mt-0.5">{student.parentPhone}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => { setReportStudent(student); setIsReportModalOpen(true); }}
                        className="p-2.5 text-muted hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                        title="Báo cáo học tập"
                      >
                        <FileBarChart size={18} />
                      </button>
                      <button 
                        onClick={() => { setCommentingStudent(student); setIsCommentModalOpen(true); }}
                        className="p-2.5 text-muted hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Nhận xét"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(student)}
                        className="p-2.5 text-muted hover:text-coral hover:bg-hairline/50 rounded-xl transition-all"
                        title="Sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        {!isLoading && filteredStudents.length === 0 && (
          <div className="py-20 text-center">
             <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4 border border-hairline text-muted-soft">
               <Search size={24} />
             </div>
             <p className="text-sm font-bold text-muted uppercase tracking-widest">Không tìm thấy học sinh nào</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedStudent ? "Sửa học sinh" : "Thêm học sinh"}>
        <StudentForm 
          classes={classes} 
          initialData={selectedStudent} 
          onCancel={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
        />
      </Modal>

      <Modal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} title={`Nhận xét: ${commentingStudent?.name}`}>
        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Xếp hạng</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star}
                  type="button"
                  onClick={() => setCommentRating(star)}
                  className={cn("p-1 transition-colors", star <= commentRating ? "text-amber-400" : "text-muted-soft")}
                >
                  <Star fill={star <= commentRating ? "currentColor" : "none"} size={24} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Nội dung nhận xét</label>
            <textarea 
              required
              rows={4}
              className="w-full px-4 py-3 bg-accent-light border border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              placeholder="Nhập nhận xét về tình hình học tập của học sinh trong tháng..."
              value={commentContent}
              onChange={e => setCommentContent(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-coral text-white py-3 rounded-xl font-bold hover:bg-coral/90 transition-all shadow-md">
            Lưu nhận xét
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        title={`Báo cáo tiến độ: ${reportStudent?.name}`}
      >
        {reportStudent && (
          <div className="space-y-6 ">
            <div className="bg-accent-light p-4 rounded-xl border border-hairline flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Thông tin cơ bản</p>
                <div className="space-y-0.5">
                  <p className="text-sm"><strong>Học sinh:</strong> {reportStudent.name}</p>
                  <p className="text-sm"><strong>Lớp học:</strong> {classes.find(c => c.id === reportStudent.classId)?.name || 'N/A'}</p>
                  <p className="text-sm"><strong>Số điện thoại:</strong> {reportStudent.parentPhone}</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <FileBarChart size={32} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-body mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-coral" />
                Lịch sử nhận xét học tập
              </h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.filter(c => c.studentId === reportStudent.id).length > 0 ? (
                  comments
                    .filter(c => c.studentId === reportStudent.id)
                    .sort((a, b) => b.year - a.year || b.month - a.month)
                    .map((com, idx) => (
                      <div key={idx} className="p-3 bg-card border border-hairline rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-hairline/50 rounded text-muted">
                            Tháng {com.month}/{com.year}
                          </span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={cn(i < com.rating ? "text-amber-400 fill-current" : "text-muted-soft")} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted leading-relaxed italic">"{com.content}"</p>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 bg-accent-light rounded-xl border border-dashed border-hairline">
                    <p className="text-xs text-muted">Chưa có nhận xét nào cho học sinh này.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-3 border border-hairline rounded-xl text-sm font-bold text-muted hover:bg-accent-light transition-colors"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  exportStudentReport(reportStudent);
                  setIsReportModalOpen(false);
                }}
                className="flex-1 py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-cyan-700 shadow-md transition-all active:scale-95"
              >
                <Download size={18} />
                Tải xuống PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Bạn có chắc chắn muốn xóa học sinh này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 py-3 bg-card border border-hairline text-muted rounded-xl font-bold hover:bg-accent-light transition-all"
            >
              Hủy
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              Xóa ngay
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
