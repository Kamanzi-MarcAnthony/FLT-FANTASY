<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore(), router = useRouter();
const email = ref(''), password = ref(''), err = ref(null), busy = ref(false);
async function submit() {
  err.value = null; busy.value = true;
  try { await auth.login(email.value, password.value); router.push('/'); } catch (e) { err.value = e; } finally { busy.value = false; }
}
</script>
<template>
  <main class="container" style="max-width:420px">
    <h1>⚽ Admin Login</h1>
    <form class="card" @submit.prevent="submit">
      <label>Email</label><input v-model="email" type="email" autocomplete="username" />
      <p class="error" v-if="err?.fields?.email">{{ err.fields.email }}</p>
      <label>Password</label><input v-model="password" type="password" autocomplete="current-password" />
      <p class="error" v-if="err?.fields?.password">{{ err.fields.password }}</p>
      <p class="error" v-if="err && !Object.keys(err.fields).length">{{ err.message }}</p>
      <p><button class="btn" :disabled="busy">{{ busy ? 'Signing in…' : 'Log in' }}</button></p>
    </form>
  </main>
</template>
