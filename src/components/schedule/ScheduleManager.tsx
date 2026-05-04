import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db, auth } from '@/src/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  updateDoc, 
  doc,
  where
} from 'firebase/firestore';
import { Class, ClassSchedule } from '@/src/types';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import Modal from '@/src/components/ui/Modal';
import { withOwner, addOwner } from '@/src/lib/firebaseUtils';

const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function ScheduleManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  
  const [newSchedule, setNewSchedule] = useState<ClassSchedule>({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '10:00',
    teacher: ''
  });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(collection(db, 'classes'), where('ownerId', '==', uid));
    return onSnapshot(q, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
    }, (err) => console.error(err));
  }, []);

  const handleUpdateSchedule = async (classId: string, updatedSchedule: ClassSchedule[]) => {
    await updateDoc(doc(db, 'classes', classId), addOwner({
      schedule: updatedSchedule
    }));
    setIsAddModalOpen(false);
  };

  const isOverlapping = (s1: ClassSchedule, s2: ClassSchedule) => {
    if (s1.dayOfWeek !== s2.dayOfWeek) return false;
    return s1.startTime < s2.endTime && s2.startTime < s1.endTime;
  };

  const addScheduleToClass = async () => {
    if (!selectedClassId) return;
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    // Check for conflicts across all classes
    let conflictFound: { className: string; schedule: ClassSchedule } | null = null;
    
    for (const otherClass of classes) {
      if (!otherClass.schedule) continue;
      for (const existingS of otherClass.schedule) {
        if (isOverlapping(newSchedule, existingS)) {
          conflictFound = { className: otherClass.name, schedule: existingS };
          break;
        }
      }
      if (conflictFound) break;
    }

    if (conflictFound) {
      setConflictError(`Trùng lịch với lớp ${conflictFound.className} (${conflictFound.schedule.startTime} - ${conflictFound.schedule.endTime})`);
      return;
    }

    const currentSchedule = cls.schedule || [];
    const updated = [...currentSchedule, newSchedule];
    await handleUpdateSchedule(selectedClassId, updated);
  };

  const removeSchedule = async (classId: string, index: number) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls || !cls.schedule) return;

    const updated = cls.schedule.filter((_, i) => i !== index);
    await handleUpdateSchedule(classId, updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Thời khóa biểu</h1>
          <p className="text-slate-500 text-sm mt-1">Lịch học chi tiết theo tuần của các lớp</p>
        </div>
      </header>

      {/* Weekly View Desktop */}
      <div className="hidden lg:grid grid-cols-7 gap-4">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="space-y-4">
             <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Thứ</p>
                <p className="text-sm font-bold text-slate-900">{day}</p>
             </div>
             
             <div className="space-y-3">
                {classes.flatMap(cls => (cls.schedule || []).map((s, sIdx) => s.dayOfWeek === dayIdx ? ({ ...s, className: cls.name, classId: cls.id, classColor: cls.color, teacher: s.teacher || cls.teacher, id: `${cls.id}-${sIdx}`, sIdx }) : null)).filter(Boolean).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)).map((session: any) => (
                  <motion.div 
                    layoutId={session.id}
                    key={session.id}
                    className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-1.5 mb-1 truncate">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: session.classColor }} />
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-500">{session.className}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                       <Clock size={12} className="text-slate-400" />
                       {session.startTime} - {session.endTime}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                       <div className="flex items-center gap-1">
                         <User size={10} />
                         <span className="truncate max-w-[60px]">{session.teacher}</span>
                       </div>
                       <button 
                        onClick={() => removeSchedule(session.classId, session.sIdx)}
                        className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        ))}
      </div>

      {/* List view for smaller screens */}
      <div className="lg:hidden space-y-6">
        {DAYS.map((day, dayIdx) => {
          const sessions = classes.flatMap(cls => (cls.schedule || []).map((s, sIdx) => s.dayOfWeek === dayIdx ? ({ ...s, className: cls.name, classColor: cls.color, teacher: s.teacher || cls.teacher }) : null)).filter(Boolean);
          if (sessions.length === 0) return null;
          return (
            <div key={day} className="space-y-3">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">{day}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sessions.map((session: any, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: session.classColor }} />
                          <p className="text-xs font-black uppercase tracking-tight text-slate-700">{session.className}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                           <Clock size={14} className="text-slate-400" />
                           {session.startTime} - {session.endTime}
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{session.teacher}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="font-serif font-bold text-xl text-slate-900">Thiết lập giờ học</h3>
               <p className="text-xs text-slate-500 mt-1">Cập nhập lịch học trực tiếp cho từng lớp</p>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="p-3 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95"
            >
              <Plus size={20} />
            </button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => (
              <div key={cls.id} className="p-5 border border-slate-100 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                   <p className="font-bold text-slate-900">{cls.name}</p>
                   <button 
                    onClick={() => {
                        setSelectedClassId(cls.id);
                        setIsAddModalOpen(true);
                    }}
                    className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                   >
                     + THÊM GIỜ
                   </button>
                </div>
                <div className="space-y-2">
                   {cls.schedule?.map((s, idx) => (
                     <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600">{DAYS[s.dayOfWeek]}</span>
                        <span className="text-[11px] font-mono font-black text-slate-900">{s.startTime}-{s.endTime}</span>
                        <button onClick={() => removeSchedule(cls.id, idx)} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                     </div>
                   )) || <p className="text-[10px] text-slate-400 italic">Chưa có lịch học</p>}
                </div>
              </div>
            ))}
         </div>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setConflictError(null);
        }} 
        title="Thêm lịch học"
      >
         <div className="space-y-6">
            {conflictError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs font-bold text-red-500">{conflictError}</p>
              </div>
            )}
            <div>
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Chọn lớp học</label>
               <select 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                 value={selectedClassId || ''}
                 onChange={(e) => {
                   setSelectedClassId(e.target.value);
                   setConflictError(null);
                 }}
               >
                 <option value="">Chọn một lớp...</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Thứ trong tuần</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                    value={newSchedule.dayOfWeek}
                    onChange={(e) => {
                      setNewSchedule({ ...newSchedule, dayOfWeek: Number(e.target.value) });
                      setConflictError(null);
                    }}
                  >
                    {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Giáo viên (Tùy chọn)</label>
                  <input 
                    type="text" 
                    placeholder="Tên giáo viên..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                    value={newSchedule.teacher || ''}
                    onChange={(e) => setNewSchedule({ ...newSchedule, teacher: e.target.value })}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Giờ bắt đầu</label>
                  <input 
                    type="time" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                    value={newSchedule.startTime}
                    onChange={(e) => {
                      setNewSchedule({ ...newSchedule, startTime: e.target.value });
                      setConflictError(null);
                    }}
                  />
               </div>
               <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Giờ kết thúc</label>
                  <input 
                    type="time" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                    value={newSchedule.endTime}
                    onChange={(e) => {
                      setNewSchedule({ ...newSchedule, endTime: e.target.value });
                      setConflictError(null);
                    }}
                  />
               </div>
            </div>

            <div className="pt-4 flex gap-3">
               <button 
                 onClick={() => {
                   setIsAddModalOpen(false);
                   setConflictError(null);
                 }}
                 className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl text-[10px] font-black tracking-widest uppercase"
               >
                 Hủy
               </button>
               <button 
                 onClick={addScheduleToClass}
                 className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-slate-200"
               >
                 Xác nhận thêm
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
