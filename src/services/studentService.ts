import { api } from '@/src/lib/api';
import { Student, StudentStatus } from '@/src/types';

export const studentService = {
  async getAll() {
    const data = await api.getStudents();
    return data.map(mapStudent);
  },
  async add(student: Omit<Student, 'id' | 'createdAt' | 'ownerId'>) {
    const result = await api.addStudent(student);
    return result.id;
  },
  async update(id: string, student: Partial<Student>) {
    await api.updateStudent(id, student);
  },
  async delete(id: string) {
    await api.deleteStudent(id);
  }
};

function mapStudent(d: any): Student {
  return {
    id: d.id,
    name: d.name,
    birthDate: d.birth_date || '',
    gender: d.gender || 'other',
    classId: d.class_id || '',
    parentName: d.parent_name || '',
    parentPhone: d.parent_phone || '',
    parentEmail: d.parent_email || '',
    email: d.email || '',
    phone: d.phone || '',
    address: d.address || '',
    notes: d.notes || '',
    status: d.status as StudentStatus || StudentStatus.ACTIVE,
    ownerId: d.owner_id,
    joinDate: d.join_date || '',
    createdAt: d.created_at || '',
  };
}

export { mapStudent };
