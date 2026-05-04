import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Class } from '@/src/types';

const COLLECTION_NAME = 'classes';

export const classService = {
  async getAll() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
    
    // Seed initial classes if empty
    if (classes.length === 0) {
      const initialClasses = [
        { name: 'Toán học Cơ bản', feePerSession: 150000, color: '#3b82f6', description: 'Phân tích và đại số' },
        { name: 'Tiếng Anh Giao tiếp', feePerSession: 200000, color: '#10b981', description: 'Speaking & Listening' },
        { name: 'Piano Trung cấp', feePerSession: 300000, color: '#f59e0b', description: 'Classic & Modern' },
      ];
      for (const c of initialClasses) {
        await addDoc(collection(db, COLLECTION_NAME), c);
      }
      return this.getAll();
    }
    return classes;
  },

  async add(cls: Omit<Class, 'id'>) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cls);
    return docRef.id;
  },

  async update(id: string, cls: Partial<Class>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, cls);
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
