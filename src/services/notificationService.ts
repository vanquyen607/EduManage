import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { withOwner, addOwner } from '@/src/lib/firebaseUtils';
import { Notification } from '@/src/types';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
  async getAll() {
    const q = query(withOwner(collection(db, COLLECTION_NAME)), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  },

  async add(notif: Omit<Notification, 'id' | 'createdAt' | 'ownerId'>) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), addOwner({
      ...notif,
      createdAt: new Date().toISOString() // Using string date for stability
    }));
    return docRef.id;
  },

  async update(id: string, notif: Partial<Notification>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, addOwner(notif));
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
