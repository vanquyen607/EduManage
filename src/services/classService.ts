import { api } from '@/src/lib/api';
import { Class } from '@/src/types';

export const classService = {
  async getAll() {
    const data = await api.getClasses();
    return data.map(mapClass);
  },
  async add(cls: Omit<Class, 'id' | 'ownerId'>) {
    const result = await api.addClass(cls);
    return result.id;
  },
  async update(id: string, cls: Partial<Class>) {
    await api.updateClass(id, cls);
  },
  async delete(id: string) {
    await api.deleteClass(id);
  }
};

function mapClass(d: any): Class {
  return {
    id: d.id,
    name: d.name,
    teacher: d.teacher || '',
    feePerSession: d.fee_per_session || 0,
    description: d.description || '',
    color: d.color || '#6366f1',
    ownerId: d.owner_id,
    schedule: Array.isArray(d.schedule) ? d.schedule : [],
  };
}

export { mapClass };
