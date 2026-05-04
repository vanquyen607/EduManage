import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

export const demoService = {
  async clearAllData() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const collections = ['classes', 'students', 'grades', 'attendance', 'invoices', 'notifications'];
    
    for (const collName of collections) {
      const q = query(collection(db, collName), where('ownerId', '==', uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(doc(db, collName, d.id));
      });
      await batch.commit();
    }
  },

  async addSampleData() {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');

    // 1. Add Classes
    const classes = [
      { 
        name: 'IELTS Mastery', 
        color: '#6366f1', 
        teacher: 'Thầy Trung', 
        feePerSession: 150000,
        description: 'Lớp luyện thi IELTS chuyên sâu',
        ownerId: uid,
        schedule: [{ dayOfWeek: 1, startTime: '18:00', endTime: '20:00' }, { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' }] 
      },
      { 
        name: 'English For Kids', 
        color: '#f59e0b', 
        teacher: 'Cô Lan', 
        feePerSession: 120000,
        description: 'Tiếng Anh thiếu nhi vui nhộn',
        ownerId: uid,
        schedule: [{ dayOfWeek: 2, startTime: '17:00', endTime: '18:30' }, { dayOfWeek: 4, startTime: '17:00', endTime: '18:30' }] 
      },
      { 
        name: 'Business English', 
        color: '#10b981', 
        teacher: 'Thầy James', 
        feePerSession: 200000,
        description: 'Tiếng Anh giao tiếp công việc',
        ownerId: uid,
        schedule: [{ dayOfWeek: 5, startTime: '19:00', endTime: '21:00' }] 
      }
    ];

    const classIds: string[] = [];
    for (const c of classes) {
      const docRef = await addDoc(collection(db, 'classes'), c);
      classIds.push(docRef.id);
    }

    // 2. Add Students
    const students = [
      { name: 'Nguyễn Văn A', classId: classIds[0], parentName: 'Nguyễn Văn B', parentPhone: '0901234567', status: 'active', ownerId: uid, createdAt: new Date().toISOString() },
      { name: 'Trần Thị C', classId: classIds[0], parentName: 'Trần Văn D', parentPhone: '0902345678', status: 'active', ownerId: uid, createdAt: new Date().toISOString() },
      { name: 'Lê Văn E', classId: classIds[1], parentName: 'Lê Thị F', parentPhone: '0903456789', status: 'active', ownerId: uid, createdAt: new Date().toISOString() },
      { name: 'Phạm Minh G', classId: classIds[2], parentName: 'Phạm Văn H', parentPhone: '0904567890', status: 'active', ownerId: uid, createdAt: new Date().toISOString() }
    ];

    const studentIds: string[] = [];
    for (const s of students) {
      const docRef = await addDoc(collection(db, 'students'), s);
      studentIds.push(docRef.id);
    }

    // 3. Add Grades
    const subjects = ['Listening', 'Reading', 'Writing', 'Speaking'];
    for (const studentId of studentIds) {
      for (const subject of subjects) {
        await addDoc(collection(db, 'grades'), {
          studentId,
          classId: students[studentIds.indexOf(studentId)].classId,
          subject,
          score: Math.floor(Math.random() * 5) + 5,
          weight: 1,
          ownerId: uid,
          date: new Date().toISOString().split('T')[0]
        });
      }
    }

    // 4. Add Notifications
    await addDoc(collection(db, 'notifications'), {
      title: 'Chào mừng bạn đến với English Center',
      content: 'Đây là dữ liệu mẫu để bạn trải nghiệm các tính năng của ứng dụng.',
      type: 'check',
      status: 'done',
      timeLabel: 'Vừa xong',
      ownerId: uid,
      createdAt: new Date().toISOString()
    });
  }
};
