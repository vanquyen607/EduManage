import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';

export interface BankSettings {
  name: string;
  accountNumber: string;
  accountName: string;
  shortName: string;
}

const COLLECTION_NAME = 'settings';

export const settingsService = {
  async getBankSettings(): Promise<BankSettings> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as BankSettings;
    }
    
    // Default values if not set
    return {
      name: "MB BANK",
      accountNumber: "123456789",
      accountName: "NGUYEN VAN A",
      shortName: "mbbank",
    };
  },

  async saveBankSettings(settings: BankSettings) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, { ...settings, ownerId: uid });
  }
};
