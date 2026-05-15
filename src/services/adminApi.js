import api from './api.js'

// Admin API servisleri
export const adminAPI = {
  // Genel bakış
  getOverview: () => api.get('/admin/overview'),

  // Kullanıcılar
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  toggleFreezeUser: (userId) => api.put(`/admin/users/${userId}/toggle-freeze`),

  // Mesajlar
  getMessages: (params = {}) => api.get('/admin/messages', { params }),
  toggleReadMessage: (msgId) => api.put(`/admin/messages/${msgId}/toggle-read`),
  deleteMessage: (msgId) => api.delete(`/admin/messages/${msgId}`),
}

// İletişim formu gönderimi (public)
export const contactAPI = {
  send: (data) => api.post('/contact', data),
}
