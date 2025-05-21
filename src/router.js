import { createRouter, createWebHashHistory } from 'vue-router';
import LoginPage from './components/Login.vue';
import HomePage from './components/Home.vue';
import ChangePassword from './components/ChangePassword';
import SpeechSynthesis from './components/SpeechSynthesis.vue'
import { useTranslationStore } from '@/stores/translation';
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/changep', component: ChangePassword, meta: { requiresAuth: true } },
    {
        path: '/home', component: HomePage,
        redirect: '/speech_synthesis',
        children: [
            {
                path: '/speech_synthesis', component: SpeechSynthesis,
                meta: {
                    keepAlive: true,
                    cacheKey: 'synthesis'
                }
            }
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const translationStore = useTranslationStore()
    if (to.path !== '/login' && !translationStore.auth.token) {
        // 未登录且不是前往登录页，重置所有状态
        translationStore.clearAuth()
        translationStore.clearAudioTranslationState()
        translationStore.clearVideoTranslationState()

        const chatStore = useChatStore()
        if (chatStore.resetState) chatStore.resetState()

        const languageStore = useLanguageStore()
        if (languageStore.resetState) languageStore.resetState()

        next('/login')
    } else {
        next()
    }
});

export default router;