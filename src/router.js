import { createRouter, createWebHashHistory } from 'vue-router';
import LoginPage from './components/Login.vue';
import HomePage from './components/Home.vue';
import SpeechRecognition from './components/SpeechRecognition';
import DialoguePage from './components/DialoguePage';
import ChangePassword from './components/ChangePassword';
import VideoRecognition from './components/VideoRecognition';
import LanguagePage from './components/LanguagePage';
import SpeechSynthesis from './components/SpeechSynthesis.vue'
// import RecordPage from './components/Record.vue';
// import MiandianPage from './components/TranslationModule.vue';
import { useTranslationStore } from '@/stores/translation';
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/changep', component: ChangePassword, meta: { requiresAuth: true } },
    {
        path: '/home', component: HomePage,
        redirect: '/speech_recognition',
        children: [
            {
                path: '/speech_recognition', component: SpeechRecognition,
                meta: {
                    keepAlive: true,
                    cacheKey: 'audio'
                }
            },
            {
                path: '/speech_recognition/video',
                component: VideoRecognition,
                meta: {
                    keepAlive: true,
                    cacheKey: 'video'
                }
            },
            {
                path: '/dialogue', component: DialoguePage,
                meta: {
                    keepAlive: true,
                    cacheKey: 'dialogue'
                }
            },
            {
                path: '/language_recognition', component: LanguagePage,
                meta: {
                    keepAlive: true,
                    cacheKey: 'language'
                }
            },
            {
                path: '/speech_synthesis', component: SpeechSynthesis,
                meta: {
                    keepAlive: true,
                    cacheKey: 'synthesis'
                }
            }
            // { path: '/record', component: RecordPage },
            // { path: '/translate', component: MiandianPage }
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