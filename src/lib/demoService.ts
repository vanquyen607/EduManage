import { api } from './api';

export const demoService = {
  async clearAllData() {
    await api.clearData();
  },
  async addSampleData() {
    await api.seedData();
  }
};
