import { createRouter, createWebHashHistory } from 'vue-router';
import LoginPage from './components/Login.vue';
import HomePage from './components/Home.vue';
import SpeechRecognition from './components/SpeechRecognition';
import DialoguePage from './components/DialoguePage';
import ChangePassword from './components/ChangePassword';
import VideoRecognition from './components/VideoRecognition';
import LanguagePage from './components/LanguagePage';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/changep', component: ChangePassword },
    {
        path: '/home', component: HomePage,
        redirect: '/speech_recognition',
        children: [
            {
                path: '/speech_recognition', component: SpeechRecognition,
            },
            {
                path: '/speech_recognition/video',
                component: VideoRecognition
            },
            { path: '/dialogue', component: DialoguePage },
            { path: '/language_recognition', component: LanguagePage }
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// router.beforeEach((to, from, next) => {
//     if (to.path === '/login') return next();
//     const tokenStr = window.sessionStorage.getItem('token');
//     if (!tokenStr) return next('/login');
//     next();
// });

export default router;