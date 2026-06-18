import { api } from '@/src/lib/api';
import { Comment } from '@/src/types';

export const commentService = {
  async getByStudent(studentId: string) {
    const data = await api.getComments(studentId);
    return data.map(mapComment);
  },
  async getAll() {
    const data = await api.getComments();
    return data.map(mapComment);
  },
  async add(comment: Omit<Comment, 'id' | 'createdAt' | 'ownerId'>) {
    const result = await api.addComment(comment);
    return result.id;
  }
};

function mapComment(d: any): Comment {
  return {
    id: d.id,
    studentId: d.student_id,
    month: d.month,
    year: d.year,
    content: d.content || '',
    rating: d.rating || 0,
    ownerId: d.owner_id,
    createdAt: d.created_at || '',
  };
}
