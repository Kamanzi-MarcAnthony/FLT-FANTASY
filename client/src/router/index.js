import { createRouter, createWebHashHistory } from 'vue-router'; // hash mode: works on GitHub Pages
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/', name: 'leagues', component: () => import('../views/LeaguesView.vue'), meta: { requiresAuth: true } },
    { path: '/leagues/:id', name: 'league', component: () => import('../views/LeagueDetailsView.vue'), meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' };
});

export default router;
