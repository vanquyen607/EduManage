import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Users, 
  Search,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  collection, 
  query, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  where,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { withOwner, addOwner } from '@/src/lib/firebaseUtils';
import { studentService } from '@/src/services/studentService';
import { classService } from '@/src/services/classService';
import { Student, Class, AttendanceStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

export default function AttendanceManager() {
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
      
      // Fetch existing records for this date and class
      const q = query(
        withOwner(collection(db, 'attendance')),
        where('classId', '==', selectedClass),
        where('date', '==', selectedDate)
      );
      const snapshot = await getDocs(q);
      const existing: Record<string, AttendanceStatus> = {};
      
      // Default all to present if no records found
      classStudents.forEach(s => {
        existing[s.id] = AttendanceStatus.PRESENT;
      });

      // Override with existing records
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        existing[data.studentId] = data.status;
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
      
      for (const student of classStudents) {
        const status = attendanceData[student.id] || AttendanceStatus.PRESENT;
        
        // Find existing record to update or create
        const q = query(
          withOwner(collection(db, 'attendance')),
          where('studentId', '==', student.id),
          where('date', '==', selectedDate)
        );
        const snapshot = await getDocs(q);
        
        const record = {
          studentId: student.id,
          classId: selectedClass,
          date: selectedDate,
          status: status,
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear()
        };

        if (!snapshot.empty) {
          const docId = snapshot.docs[0].id;
          await updateDoc(doc(db, 'attendance', docId), addOwner(record));
        } else {
          await addDoc(collection(db, 'attendance'), addOwner(record));
        }
      }
      
      console.log('Attendance saved successfully');
    } catch (err) {
      console.error("Error saving attendance:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const classStudents = students.filter(s => s.classId === selectedClass);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="h-px w-8 bg-accent" />
             <p className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Điểm danh hàng ngày</p>
          </div>
          <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Ghi nhận Chuyên cần</h2>
          <p className="text-slate-500 text-sm mt-1">Ghi nhận sự hiện diện để tính học phí thực tế cho học viên.</p>
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
             className="px-6 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black tracking-widest uppercase hover:border-slate-900 transition-all active:scale-95 shadow-sm"
           >
              CHỌN TẤT CẢ ({classStudents.every(s => (attendanceData[s.id] || AttendanceStatus.PRESENT) === AttendanceStatus.PRESENT) ? 'VẮNG' : 'CÓ MẶT'})
           </button>
           <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200">
             <CalendarIcon size={14} className="text-slate-400" />
             <input 
               type="date"
               className="bg-transparent border-none outline-none text-[11px] font-black tracking-widest uppercase cursor-pointer"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
             />
           </div>
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
           >
             {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
             LƯU DỮ LIỆU
           </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
         <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-100">
            <Users size={24} />
         </div>
         <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chọn lớp đào tạo</p>
            <select 
              className="w-full bg-transparent outline-none font-serif text-2xl font-bold text-slate-900 cursor-pointer appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{classStudents.length} học sinh đang theo học</p>
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
                  ? "bg-white border-slate-100 hover:border-slate-900 hover:shadow-2xl hover:-translate-y-1" 
                  : "bg-red-50/50 border-red-100 shadow-inner"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-serif text-xl font-bold transition-all duration-500 shadow-xl",
                  status === AttendanceStatus.PRESENT ? "bg-slate-900 text-white group-hover:scale-110" : "bg-red-500 text-white"
                )}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <p className={cn("font-bold text-slate-900 text-base transition-colors", status === AttendanceStatus.ABSENT && "text-red-700")}>
                    {student.name}
                  </p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mt-1",
                    status === AttendanceStatus.PRESENT ? "text-slate-400" : "text-red-400"
                  )}>
                    {status === AttendanceStatus.PRESENT ? 'PRESENT' : 'ABSENT'}
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                status === AttendanceStatus.PRESENT 
                  ? "bg-white border-slate-100 text-slate-200 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:rotate-12" 
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
