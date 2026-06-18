const BASE_URL = import.meta.env.VITE_API_URL || '';

let _token: string | null = localStorage.getItem('token');

export function setToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getToken() {
  return _token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, displayName?: string) =>
    request<{ user: any; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  getMe: () =>
    request<{ user: any }>('/api/auth/me'),
  updateProfile: (data: { displayName?: string; email?: string }) =>
    request<{ user: any }>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Students
  getStudents: () => request<any[]>('/api/students'),
  addStudent: (data: any) => request<any>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: any) => request<any>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id: string) => request<any>(`/api/students/${id}`, { method: 'DELETE' }),

  // Classes
  getClasses: () => request<any[]>('/api/classes'),
  addClass: (data: any) => request<any>('/api/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id: string, data: any) => request<any>(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id: string) => request<any>(`/api/classes/${id}`, { method: 'DELETE' }),

  // Grades
  getGrades: () => request<any[]>('/api/grades'),
  addGrade: (data: any) => request<any>('/api/grades', { method: 'POST', body: JSON.stringify(data) }),
  updateGrade: (id: string, data: any) => request<any>(`/api/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGrade: (id: string) => request<any>(`/api/grades/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/attendance${qs}`);
  },
  markAttendance: (data: any) => request<any>('/api/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // Invoices
  getInvoices: () => request<any[]>('/api/invoices'),
  addInvoice: (data: any) => request<any>('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) => request<any>(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => request<any>(`/api/invoices/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request<any[]>('/api/notifications'),
  addNotification: (data: any) => request<any>('/api/notifications', { method: 'POST', body: JSON.stringify(data) }),
  updateNotification: (id: string, data: any) => request<any>(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNotification: (id: string) => request<any>(`/api/notifications/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (studentId?: string) => request<any[]>(`/api/comments${studentId ? `?studentId=${studentId}` : ''}`),
  addComment: (data: any) => request<any>('/api/comments', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request<any>('/api/settings'),
  updateSettings: (data: any) => request<any>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Demo
  clearData: () => request<any>('/api/demo/clear', { method: 'POST' }),
  seedData: () => request<any>('/api/demo/seed', { method: 'POST' }),
};
