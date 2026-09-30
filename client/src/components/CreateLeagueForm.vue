<script setup>
import { reactive, ref } from 'vue';
import { http } from '../api/http';
import Modal from './Modal.vue';
const emit = defineEmits(['close', 'created']);
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const OPTIONS = ['GOALS', 'ASSISTS', 'CLEANSHEETS'];
const f = reactive({ name: '', location: '', startDate: '', endDate: '', recurring: true, matchday: 6, kickoffTime: '15:00', matchdayEndTime: '17:00',
  maxTransfers: 2, transferDeadlineHours: 24, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, scoring: [] });
const errors = ref({}), message = ref(''), busy = ref(false);
const toggle = (o) => { const i = f.scoring.indexOf(o); i < 0 ? f.scoring.push(o) : f.scoring.splice(i, 1); };
async function submit() {
  errors.value = {}; message.value = ''; busy.value = true;
  try { emit('created', (await http('/leagues', { method: 'POST', body: { ...f, maxTransfers: f.maxTransfers === '' ? null : f.maxTransfers } })).league); emit('close'); }
  catch (e) { errors.value = e.fields || {}; message.value = e.message; } finally { busy.value = false; }
}
</script>
<template>
  <Modal @close="emit('close')">
    <h2>Create League</h2>
    <form @submit.prevent="submit">
      <strong>League details</strong>
      <label>League Name</label><input v-model="f.name" /><p class="error">{{ errors.name }}</p>
      <div class="row">
        <div><label>Start Date</label><input type="date" v-model="f.startDate" /><p class="error">{{ errors.startDate }}</p></div>
        <div><label>End Date {{ f.recurring ? '' : '(optional)' }}</label><input type="date" v-model="f.endDate" /><p class="error">{{ errors.endDate }}</p></div>
      </div>
      <label><input type="checkbox" v-model="f.recurring" style="width:auto" /> Recurring (weekly)</label>
      <label>Location</label><input v-model="f.location" /><p class="error">{{ errors.location }}</p>

      <strong>Matchday & transfers</strong>
      <div class="row">
        <div><label>Matchday</label><select v-model.number="f.matchday"><option v-for="(d, i) in DAYS" :key="i" :value="i">{{ d }}</option></select><p class="error">{{ errors.matchday }}</p></div>
        <div><label>Kickoff</label><input type="time" v-model="f.kickoffTime" /><p class="error">{{ errors.kickoffTime }}</p></div>
        <div><label>Matchday ends</label><input type="time" v-model="f.matchdayEndTime" /><p class="error">{{ errors.matchdayEndTime }}</p></div>
      </div>
      <div class="row">
        <div><label>Max transfers / matchweek (0–7)</label><input type="number" min="0" max="7" v-model.number="f.maxTransfers" /><p class="error">{{ errors.maxTransfers }}</p></div>
        <div><label>Transfer deadline</label><select v-model.number="f.transferDeadlineHours"><option :value="6">6 hrs before</option><option :value="8">8 hrs before</option><option :value="24">24 hrs before</option></select><p class="error">{{ errors.transferDeadlineHours }}</p></div>
      </div>
      <label>Timezone</label><input v-model="f.timezone" /><p class="error">{{ errors.timezone }}</p>

      <strong>Points & scores</strong>
      <div class="chips" style="margin-top:8px"><button type="button" v-for="o in OPTIONS" :key="o" class="chip" :class="{ on: f.scoring.includes(o) }" @click="toggle(o)">{{ o }}</button></div>
      <p class="error">{{ errors.scoring }}</p>

      <p class="error" v-if="message && !Object.keys(errors).length">{{ message }}</p>
      <div class="row" style="margin-top:16px"><button type="button" class="btn ghost" @click="emit('close')">Cancel</button><button class="btn" :disabled="busy">{{ busy ? 'Creating…' : 'Create League' }}</button></div>
    </form>
  </Modal>
</template>
