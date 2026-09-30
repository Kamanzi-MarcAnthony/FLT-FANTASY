<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore(), router = useRouter();
const out = async () => { await auth.logout(); router.push('/login'); };
</script>
<template>
  <header class="bar">
    <strong><RouterLink to="/">⚽ Fantasy Football</RouterLink></strong>
    <nav>
      <RouterLink v-if="auth.isSuperAdmin" to="/admins">Admins</RouterLink>
      <span class="muted">{{ auth.user?.name }} <span class="badge">{{ auth.user?.role === 'super_admin' ? 'Super Admin' : 'Admin' }}</span></span>
      <button class="btn ghost" @click="out">Logout</button>
    </nav>
  </header>
</template>
