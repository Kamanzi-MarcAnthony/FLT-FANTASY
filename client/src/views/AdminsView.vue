<script setup>
import { onMounted, reactive, ref } from 'vue';
import { http } from '../api/http';
import AppHeader from '../components/AppHeader.vue';
const admins = ref([]), f = reactive({ name: '', email: '', password: '' }), errors = ref({}), message = ref(''), ok = ref('');
const load = async () => (admins.value = (await http('/admins')).admins);
onMounted(load);
async function add() {
  errors.value = {}; message.value = ''; ok.value = '';
  try { const a = (await http('/admins', { method: 'POST', body: { ...f } })).admin; ok.value = `Added ${a.name}`; f.name = f.email = f.password = ''; await load(); }
  catch (e) { errors.value = e.fields || {}; message.value = e.message; }
}
</script>
<template>
  <main class="container">
    <AppHeader /><h1>Admin accounts</h1>
    <form class="card" @submit.prevent="add" style="margin-bottom:16px">
      <strong>Add admin</strong>
      <div class="row">
        <div><label>Name</label><input v-model="f.name" /><p class="error">{{ errors.name }}</p></div>
        <div><label>Email</label><input v-model="f.email" type="email" /><p class="error">{{ errors.email }}</p></div>
        <div><label>Temporary password</label><input v-model="f.password" type="text" /><p class="error">{{ errors.password }}</p></div>
      </div>
      <p class="error" v-if="message && !Object.keys(errors).length">{{ message }}</p><p v-if="ok" style="color:var(--accent)">{{ ok }}</p>
      <button class="btn">Add admin</button>
    </form>
    <div class="card"><table style="width:100%"><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
      <tbody><tr v-for="a in admins" :key="a.id"><td>{{ a.name }}</td><td>{{ a.email }}</td><td><span class="badge">{{ a.role }}</span></td></tr></tbody></table></div>
  </main>
</template>
