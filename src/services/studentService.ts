import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Student, StudentStatus } from '@/src/types';

const COLLECTION_NAME = 'students';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const studentService = {
  async getAll() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      
      if (students.length === 0) {
        const classes = await getDocs(collection(db, 'classes'));
        const firstClassId = classes.docs[0]?.id || 'default_class';

        // Seed some students for demo
        const mockStudents: Omit<Student, 'id' | 'createdAt'>[] = [
          { name: 'Nguyễn Văn A', birthDate: '2015-05-12', gender: 'male', classId: firstClassId, parentName: 'Nguyễn Văn B', parentPhone: '0912345678', parentEmail: 'parent@example.com', status: StudentStatus.ACTIVE },
          { name: 'Lê Thị B', birthDate: '2014-11-20', gender: 'female', classId: firstClassId, parentName: 'Lê Văn C', parentPhone: '0987654321', parentEmail: 'parent2@example.com', status: StudentStatus.ACTIVE },
        ];
        
        for (const s of mockStudents) {
          await addDoc(collection(db, COLLECTION_NAME), { ...s, createdAt: new Date().toISOString() });
        }
        return this.getAll();
      }

      return students;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async add(student: Omit<Student, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...student,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  async update(id: string, student: Partial<Student>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, student);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async delete(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
