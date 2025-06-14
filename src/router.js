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

const base = process.env.NODE_ENV === 'production' ? '/minnan/' : '/';

const router = createRouter({
    history: createWebHashHistory(base),
    routes
});

import { useChatStore } from '@/stores/chat';
import { useLanguageStore } from '@/stores/language';

router.beforeEach((to, from, next) => {
    const translationStore = useTranslationStore()

    console.log(translationStore.auth)

    // 如果你刷新页面，没有从 sessionStorage 或 localStorage 恢复 token，那么 Pinia 的 auth 状态就会回到初始值 null
    // 因为 store 是在每次应用加载时重新创建的。所以即使之前成功登录，刷新页面后 auth 的值也会丢失
    const token = window.sessionStorage.getItem("token");
    const username = window.sessionStorage.getItem("username");
    if (token && username) {
        translationStore.setAuth(token, username);
    }

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