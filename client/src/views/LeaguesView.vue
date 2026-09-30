<script setup>
import { onMounted, ref } from 'vue';
import { http } from '../api/http';
import AppHeader from '../components/AppHeader.vue';
import CreateLeagueForm from '../components/CreateLeagueForm.vue';
const leagues = ref([]), loading = ref(true), error = ref(''), showForm = ref(false);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
onMounted(async () => { try { leagues.value = (await http('/leagues')).leagues; } catch (e) { error.value = e.message; } loading.value = false; });
</script>
<template>
  <main class="container">
    <AppHeader />
    <div class="bar"><h1>Leagues</h1><button class="btn" @click="showForm = true">+ Create League</button></div>
    <p class="error">{{ error }}</p><p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="!leagues.length" class="muted">No leagues yet. Create your first league.</p>
    <div class="grid">
      <RouterLink v-for="l in leagues" :key="l.id" :to="`/leagues/${l.id}`" class="card" style="color:inherit">
        <h3 style="margin:0 0 6px">{{ l.name }}</h3>
        <p class="muted">📍 {{ l.location }}<br />{{ l.startDate }} → {{ l.endDate }} <span class="badge" v-if="l.recurring">Weekly</span><br />Matchday: {{ DAYS[l.matchday] }} {{ l.kickoffTime }} · {{ l.playerCount }} players</p>
        <span class="chips"><span class="badge" v-for="s in l.scoring" :key="s">{{ s }}</span></span>
      </RouterLink>
    </div>
    <CreateLeagueForm v-if="showForm" @close="showForm = false" @created="(l) => leagues.unshift(l)" />
  </main>
</template>
