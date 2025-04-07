import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTranslationStore = defineStore('translation', () => {
    // 用户认证状态
    const auth = ref({
        token: null,
        username: null
    })

    // 音频翻译状态
    const audioTranslation = ref({
        fileList: [],
        audioFile: null,
        audioName: '',
        recognitionResult: '',
        highlightedTexts: [],
        recognitionData: null,
        audioSrc: ''
    })
    // 视频翻译状态
    const videoTranslation = ref({
        videoFile: null,
        videoName: '',
        videoSrc: '',
        videoFileList: [],
        videoDuration: 0,
        videoTimestamp: [0, 0],
        marks: {},
        recognitionResult: '',
        subtitles: [],
        highlightedTexts: []
    })
    // 设置用户信息
    const setAuth = (token, username) => {
        auth.value.token = token
        auth.value.username = username
    }

    // 清除用户信息
    const clearAuth = () => {
        auth.value.token = null
        auth.value.username = null
    }

    // 保存音频翻译状态
    const saveAudioTranslationState = (state) => {
        audioTranslation.value = {
            ...state,
            // 确保 File 对象不会被直接存储
            audioFile: state.audioFile instanceof File ? state.audioFile : null
        }
    }

    // 清除音频翻译状态
    const clearAudioTranslationState = () => {
        audioTranslation.value = {
            fileList: [],
            audioFile: null,
            audioName: '',
            recognitionResult: '',
            highlightedTexts: [],
            recognitionData: null,
            audioSrc: ''
        }
    }
    // 保存视频翻译状态
    const saveVideoTranslationState = (state) => {
        videoTranslation.value = {
            ...state,
            videoFile: state.videoFile instanceof File ? state.videoFile : null
        }
    }

    // 清除视频翻译状态
    const clearVideoTranslationState = () => {
        videoTranslation.value = {
            videoFile: null,
            videoName: '',
            videoSrc: '',
            videoFileList: [],
            videoDuration: 0,
            videoTimestamp: [0, 0],
            marks: {},
            recognitionResult: '',
            subtitles: [],
            highlightedTexts: []
        }
    }
    return {
        auth,
        audioTranslation,
        videoTranslation,
        setAuth,
        clearAuth,
        saveAudioTranslationState,
        clearAudioTranslationState,
        saveVideoTranslationState,
        clearVideoTranslationState
    }
})