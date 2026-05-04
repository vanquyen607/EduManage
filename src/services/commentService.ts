import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Comment } from '@/src/types';

const COLLECTION_NAME = 'comments';

export const commentService = {
  async getByStudent(studentId: string) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  },

  async getAll() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  },

  async add(comment: Omit<Comment, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...comment,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  }
};
