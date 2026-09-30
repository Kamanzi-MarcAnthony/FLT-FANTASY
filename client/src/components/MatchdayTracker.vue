<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { http } from '../api/http';
import { getMatchdayState, fmt } from '../matchdayState';
const props = defineProps({ leagueId: [String, Number] });
const mds = ref([]), skew = ref(0), now = ref(Date.now()); let timer;
onMounted(async () => {
  const r = await http(`/leagues/${props.leagueId}/tracker`);
  mds.value = r.matchdays; skew.value = Date.parse(r.serverTime) - Date.now(); // trust server clock, not the device's
  timer = setInterval(() => (now.value = Date.now() + skew.value), 1000);
});
onUnmounted(() => clearInterval(timer));
const s = computed(() => getMatchdayState(mds.value, now.value));
const view = computed(() => {
  const { state, m, ms, deadlineMs } = s.value;
  if (!mds.value.length) return null;
  if (state === 'complete') return { cls: '', title: 'League complete', sub: 'All matchdays have been played.' };
  if (state === 'active') return { cls: 'active', title: `Matchday ${m.number} Active`, sub: `Ends in ${fmt(ms)} · Transfers closed` };
  if (state === 'locked') return { cls: 'locked', title: `Matchday ${m.number} starts in ${fmt(ms)}`, sub: 'Transfers closed until the matchday ends' };
  if (state === 'not_started') return { cls: '', title: `League starts soon · Matchday 1 in ${fmt(ms)}`, sub: 'Transfers open at the start of the matchweek' };
  return { cls: '', title: `Matchday ${m.number} starts in ${fmt(ms)}`, sub: `Transfers open · close in ${fmt(deadlineMs)}` };
});
</script>
<template>
  <div v-if="view" class="card tracker" :class="view.cls" style="margin-bottom:16px">
    <div class="muted">MATCHDAY TRACKER</div><h2 style="margin:4px 0">{{ view.title }}</h2><div class="muted">{{ view.sub }}</div>
  </div>
</template>
