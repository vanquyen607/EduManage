import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { withOwner, addOwner } from '@/src/lib/firebaseUtils';
import { Class } from '@/src/types';

const COLLECTION_NAME = 'classes';

export const classService = {
  async getAll() {
    const snapshot = await getDocs(withOwner(collection(db, COLLECTION_NAME)));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
  },

  async add(cls: Omit<Class, 'id' | 'ownerId'>) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), addOwner(cls));
    return docRef.id;
  },

  async update(id: string, cls: Partial<Class>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, addOwner(cls));
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
