import { defineStore } from 'pinia';
import { http } from '../api/http';

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, ready: false }), // user: { id, name, email, role: 'admin' | 'super_admin' }
  getters: { isAuthenticated: (s) => !!s.user, isSuperAdmin: (s) => s.user?.role === 'super_admin' },
  actions: {
    async init() {
      if (this.ready) return;
      try { this.user = (await http('/auth/me')).user; } catch { this.user = null; }
      this.ready = true;
    },
    async login(email, password) { this.user = (await http('/auth/login', { method: 'POST', body: { email, password } })).user; },
    async logout() { await http('/auth/logout', { method: 'POST' }); this.user = null; },
  },
});
