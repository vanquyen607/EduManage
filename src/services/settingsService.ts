import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export interface BankSettings {
  name: string;
  accountNumber: string;
  accountName: string;
  shortName: string;
}

const COLLECTION_NAME = 'settings';
const DOC_ID = 'bank_info';

export const settingsService = {
  async getBankSettings(): Promise<BankSettings> {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
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
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, settings);
  }
};
