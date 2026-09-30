<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { http, fileUrl } from '../api/http';
import AppHeader from '../components/AppHeader.vue';
import MatchdayTracker from '../components/MatchdayTracker.vue';
import AddPlayerForm from '../components/AddPlayerForm.vue';
const id = useRoute().params.id, DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const league = ref(null), points = ref({}), players = ref([]), error = ref(''), showAdd = ref(false), filter = ref('');
onMounted(async () => {
  try { const r = await http(`/leagues/${id}`); league.value = r.league; points.value = r.points; players.value = (await http(`/leagues/${id}/players`)).players; }
  catch (e) { error.value = e.message; }
});
const shown = computed(() => players.value.filter((p) => !filter.value || p.position === filter.value).sort((a, b) => b.ovr - a.ovr));
const rows = computed(() => { const s = league.value?.scoring || [], P = points.value, r = [];
  if (s.includes('GOALS')) r.push(['Goal', ...['GK', 'DEF', 'MID', 'ST'].map((k) => P.goal[k])]);
  if (s.includes('ASSISTS')) r.push(['Assist', ...['GK', 'DEF', 'MID', 'ST'].map((k) => P.assist[k])]);
  if (s.includes('CLEANSHEETS')) r.push(['Clean sheet', ...['GK', 'DEF', 'MID', 'ST'].map((k) => P.cleanSheet[k])]);
  return r; });
</script>
<template>
  <main class="container">
    <AppHeader /><RouterLink to="/">← Leagues</RouterLink>
    <p class="error">{{ error }}</p>
    <template v-if="league">
      <h1 style="margin-top:12px">{{ league.name }}</h1>
      <MatchdayTracker :league-id="id" />
      <div class="card" style="margin-bottom:16px">
        <p class="muted">📍 {{ league.location }} · {{ league.startDate }} → {{ league.endDate }} <span class="badge" v-if="league.recurring">Weekly</span></p>
        <p>Matchday: <b>{{ DAYS[league.matchday] }}</b> {{ league.kickoffTime }}–{{ league.matchdayEndTime }} ({{ league.timezone }})<br />
          Max transfers per matchweek: <b>{{ league.maxTransfers }}</b> · Transfer deadline: <b>{{ league.transferDeadlineHours }} hrs</b> before kickoff</p>
        <table><thead><tr><th>Points</th><th>GK</th><th>DEF</th><th>MID</th><th>ST</th></tr></thead><tbody><tr v-for="r in rows" :key="r[0]"><td v-for="(c, i) in r" :key="i">{{ c }}</td></tr></tbody></table>
        <p class="muted" v-if="league.scoring.includes('GOALS')">Goal bonus: +{{ points.bonus?.twoOrMoreGoals }} for 2+ goals, +{{ points.bonus?.oneGoal }} for 1 goal</p>
      </div>
      <div class="bar"><h2 style="margin:0">Players ({{ players.length }})</h2>
        <div class="row" style="flex:none"><select v-model="filter" style="width:auto"><option value="">All</option><option>GK</option><option>DEF</option><option>MID</option><option>ST</option></select><button class="btn" @click="showAdd = true">+ Add Player</button></div></div>
      <div class="card">
        <p class="muted" v-if="!shown.length">No players yet.</p>
        <div class="player" v-for="p in shown" :key="p.id"><img class="avatar" :src="fileUrl(p.photoUrl) || undefined" :alt="p.name" /><div><b>{{ p.name }}</b><br /><span class="badge">{{ p.position }}</span></div><span class="ovr">{{ p.ovr }}</span></div>
      </div>
      <AddPlayerForm v-if="showAdd" :league-id="id" @close="showAdd = false" @saved="(p) => players.push(p)" />
    </template>
  </main>
</template>
