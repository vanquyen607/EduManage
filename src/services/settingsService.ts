import { api } from '@/src/lib/api';

export interface BankSettings {
  name: string;
  accountNumber: string;
  accountName: string;
  shortName: string;
}

export const settingsService = {
  async getBankSettings(): Promise<BankSettings> {
    return api.getSettings();
  },
  async saveBankSettings(settings: BankSettings) {
    await api.updateSettings(settings);
  }
};
