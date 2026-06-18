import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Users, 
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/src/lib/api';
import { studentService } from '@/src/services/studentService';
import { classService } from '@/src/services/classService';
import { Student, Class, AttendanceStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/src/lib/toast';

export default function AttendanceManager() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [sData, cData] = await Promise.all([
        studentService.getAll(),
        classService.getAll()
      ]);
      setStudents(sData);
      setClasses(cData);
      if (cData.length > 0) setSelectedClass(cData[0].id);
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate, students]);

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const classStudents = students.filter(s => s.classId === selectedClass);
      const data = await api.getAttendance({ classId: selectedClass, date: selectedDate });
      const existing: Record<string, AttendanceStatus> = {};
      classStudents.forEach(s => {
        existing[s.id] = AttendanceStatus.PRESENT;
      });
      data.forEach((d: any) => {
        existing[d.student_id] = d.status;
      });
      setAttendanceData(existing);
    } catch (err) {
      console.error("Error loading attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (studentId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === AttendanceStatus.PRESENT 
        ? AttendanceStatus.ABSENT 
        : AttendanceStatus.PRESENT
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dateObj = new Date(selectedDate);
      const classStudents = students.filter(s => s.classId === selectedClass);
      
      await Promise.all(classStudents.map(student => {
        const status = attendanceData[student.id] || AttendanceStatus.PRESENT;
        return api.markAttendance({
          studentId: student.id,
          classId: selectedClass,
          date: selectedDate,
          status,
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear()
        });
      }));
      
      toast('Đã lưu điểm danh thành công!', 'success');
    } catch (err) {
      toast('Có lỗi khi lưu điểm danh!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const classStudents = students.filter(s => s.classId === selectedClass);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Điểm danh hàng ngày</p>
          </div>
          <h2 className="text-4xl  font-bold text-ink tracking-tight">Ghi nhận Chuyên cần</h2>
          <p className="text-muted text-sm mt-1">Ghi nhận sự hiện diện để tính học phí thực tế cho học viên.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={() => {
               const allPresent = classStudents.every(s => (attendanceData[s.id] || AttendanceStatus.PRESENT) === AttendanceStatus.PRESENT);
               const nextStatus = allPresent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
               const nextData = { ...attendanceData };
               classStudents.forEach(s => nextData[s.id] = nextStatus);
               setAttendanceData(nextData);
             }}
             className="px-6 py-2.5 bg-card border border-hairline text-ink rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:border-slate-900 transition-all active:scale-95 shadow-sm"
           >
              CHỌN TẤT CẢ ({classStudents.every(s => (attendanceData[s.id] || AttendanceStatus.PRESENT) === AttendanceStatus.PRESENT) ? 'VẮNG' : 'CÓ MẶT'})
           </button>
           <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl border border-hairline">
             <CalendarIcon size={14} className="text-muted" />
             <input 
               type="date"
               className="bg-transparent border-none outline-none text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
             />
           </div>
           <button 
             onClick={handleSave}
             disabled={isSaving}
              className="bg-coral text-white px-6 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2 hover:bg-coral-active transition-all disabled:opacity-50 shadow-lg shadow-coral/20"
           >
             {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
             LƯU DỮ LIỆU
           </button>
        </div>
      </div>

      <div className="bg-card p-8 rounded-xl border border-hairline shadow-sm flex items-center gap-6">
         <div className="p-4 bg-surface-dark text-white rounded-xl shadow-xl">
            <Users size={24} />
         </div>
         <div className="flex-1">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Chọn lớp đào tạo</p>
            <select 
              className="w-full bg-transparent outline-none  text-2xl font-bold text-ink cursor-pointer appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
               <p className="text-[10px] font-black text-muted uppercase tracking-tighter">{classStudents.length} học sinh đang theo học</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classStudents.map((student, idx) => {
          const status = attendanceData[student.id];
          return (
            <motion.div 
              layout
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleToggle(student.id)}
              className={cn(
                "p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer flex items-center justify-between group relative overflow-hidden",
                status === AttendanceStatus.PRESENT 
                  ? "bg-card border-hairline hover:border-slate-900 hover:shadow-2xl hover:-translate-y-1" 
                  : "bg-red-50/50 border-red-100 shadow-inner"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center  text-xl font-bold transition-all duration-500 shadow-xl",
                  status === AttendanceStatus.PRESENT ? "bg-surface-dark text-white group-hover:scale-110" : "bg-red-500 text-white"
                )}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <p className={cn("font-bold text-ink text-base transition-colors", status === AttendanceStatus.ABSENT && "text-red-700")}>
                    {student.name}
                  </p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-1",
                    status === AttendanceStatus.PRESENT ? "text-muted" : "text-red-400"
                  )}>
                    {status === AttendanceStatus.PRESENT ? 'PRESENT' : 'ABSENT'}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border-2",
                status === AttendanceStatus.PRESENT 
                  ? "bg-card border-hairline text-muted-soft group-hover:border-accent-teal group-hover:bg-accent-teal group-hover:text-white group-hover:rotate-12" 
                  : "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200"
              )}>
                {status === AttendanceStatus.PRESENT ? <Check size={20} /> : <X size={20} />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
