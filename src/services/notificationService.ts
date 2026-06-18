import { api } from '@/src/lib/api';
import { Notification } from '@/src/types';

export const notificationService = {
  async getAll() {
    const data = await api.getNotifications();
    return data.map(mapNotification);
  },
  async add(notif: Omit<Notification, 'id' | 'createdAt' | 'ownerId'>) {
    const result = await api.addNotification(notif);
    return result.id;
  },
  async update(id: string, notif: Partial<Notification>) {
    await api.updateNotification(id, notif);
  },
  async delete(id: string) {
    await api.deleteNotification(id);
  }
};

function mapNotification(d: any): Notification {
  return {
    id: d.id,
    title: d.title,
    timeLabel: d.time_label || '',
    status: d.status || 'pending',
    type: d.type || 'clock',
    ownerId: d.owner_id,
    createdAt: d.created_at || '',
  };
}
