import { defineStore } from 'pinia';

// Stub: real login/logout arrive in milestone 2.
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null }), // { id, name, email, role: 'admin' | 'super_admin' }
  getters: {
    isAuthenticated: (s) => !!s.user,
    isSuperAdmin: (s) => s.user?.role === 'super_admin',
  },
});
