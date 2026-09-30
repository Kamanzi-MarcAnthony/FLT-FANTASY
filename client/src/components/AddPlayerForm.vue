<script setup>
import { reactive, ref } from 'vue';
import { http } from '../api/http';
import Modal from './Modal.vue';
const props = defineProps({ leagueId: [String, Number] });
const emit = defineEmits(['close', 'saved']);
const f = reactive({ name: '', position: '', ovr: '' }), file = ref(null), preview = ref(''), errors = ref({}), message = ref(''), busy = ref(false);
function pick(e) {
  const x = e.target.files[0]; errors.value = { ...errors.value, photo: '' };
  if (!x) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(x.type)) return (errors.value.photo = 'jpg, png or webp only');
  if (x.size > 2 * 1024 * 1024) return (errors.value.photo = 'Max 2 MB');
  file.value = x; preview.value = URL.createObjectURL(x);
}
async function save() {
  errors.value = {}; message.value = ''; busy.value = true;
  const fd = new FormData(); fd.append('name', f.name); fd.append('position', f.position); fd.append('ovr', f.ovr); if (file.value) fd.append('photo', file.value);
  try { emit('saved', (await http(`/leagues/${props.leagueId}/players`, { method: 'POST', body: fd, isForm: true })).player); emit('close'); }
  catch (e) { errors.value = e.fields || {}; message.value = e.message; } finally { busy.value = false; }
}
</script>
<template>
  <Modal @close="emit('close')">
    <h2>Register Player</h2>
    <form @submit.prevent="save">
      <label>Player name</label><input v-model="f.name" /><p class="error">{{ errors.name }}</p>
      <label>Photo</label><input type="file" accept="image/jpeg,image/png,image/webp" @change="pick" /><p class="error">{{ errors.photo }}</p>
      <img v-if="preview" :src="preview" class="avatar" style="width:80px;height:80px" />
      <div class="row">
        <div><label>Position</label><select v-model="f.position"><option value="" disabled>Select…</option><option>GK</option><option>DEF</option><option>MID</option><option>ST</option></select><p class="error">{{ errors.position }}</p></div>
        <div><label>OVR (1–99)</label><input type="number" min="1" max="99" v-model="f.ovr" /><p class="error">{{ errors.ovr }}</p></div>
      </div>
      <p class="error" v-if="message && !Object.keys(errors).length">{{ message }}</p>
      <div class="row" style="margin-top:16px"><button type="button" class="btn ghost" @click="emit('close')">Cancel</button><button class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Save' }}</button></div>
    </form>
  </Modal>
</template>
