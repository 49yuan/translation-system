import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './components/Login.vue';
import HomePage from './components/Home.vue';
import SpeechRecognition from './components/SpeechRecognition';
import DialoguePage from './components/DialoguePage';
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    {
        path: '/home', component: HomePage,
        redirect: '/speech_recognition',
        children: [
            { path: '/speech_recognition', component: SpeechRecognition },
            { path: '/dialogue', component: DialoguePage }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.path === '/login') return next();
    const tokenStr = window.sessionStorage.getItem('token');
    if (!tokenStr) return next('/login');
    next();
});

export default router;