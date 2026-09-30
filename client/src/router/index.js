import { createRouter, createWebHashHistory } from 'vue-router'; // hash mode: works on GitHub Pages
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/', name: 'leagues', component: () => import('../views/LeaguesView.vue'), meta: { auth: true } },
    { path: '/leagues/:id', name: 'league', component: () => import('../views/LeagueDetailsView.vue'), meta: { auth: true } },
    { path: '/admins', name: 'admins', component: () => import('../views/AdminsView.vue'), meta: { auth: true, superAdmin: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();
  if (to.meta.auth && !auth.isAuthenticated) return { name: 'login' };
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'leagues' };
  if (to.meta.superAdmin && !auth.isSuperAdmin) return { name: 'leagues' };
});
export default router;
