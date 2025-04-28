import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useChatStore = defineStore('chat', () => {
    // 音频相关状态
    const audioState = ref({
        audioSrc: null,
        audioName: '',
        isTranslating: false,
        recognitionData: null
    })

    // 聊天记录状态
    const chatState = ref({
        chatItems: [],
        filteredChatItems: [],
        highlightedIndex: -1
    })

    // 说话人相关状态
    const speakerState = reactive({
        speakers: [],
        selectedSpeakers: {},
        speakerColors: {
            0: '#409EFF',
            1: '#FFD04B',
            2: '#8338EC',
            3: '#15999C',
            4: '#E76F51',
            5: '#B4BEC9',
            6: '#546E7A',
            7: '#4CA8F5',
            8: '#F9D428',
            9: '#F28F43',
            10: '#BDC3C7',
        }
    })

    // 对话框状态
    const dialogState = reactive({
        addVoiceDialogVisible: false,
        createSpeakerDialogVisible: false,
        selectedSpeaker: null,
        newSpeakerName: '',
        speakerFiles: [],
        addVoiceFiles: []
    })

    // 搜索状态
    const searchState = ref({
        searchQuery: ''
    })

    // 更新音频状态
    const updateAudioState = (state) => {
        audioState.value = { ...audioState.value, ...state }
    }

    // 更新聊天状态
    const updateChatState = (state) => {
        chatState.value = { ...chatState.value, ...state }
    }

    // 更新说话人状态
    const updateSpeakerState = (state) => {
        Object.assign(speakerState, state)
    }

    // 更新对话框状态
    const updateDialogState = (state) => {
        Object.assign(dialogState, state)
    }

    // 更新搜索状态
    const updateSearchState = (state) => {
        searchState.value = { ...searchState.value, ...state }
    }

    // 重置状态
    const resetState = () => {
        audioState.value = {
            audioSrc: null,
            audioName: '',
            isTranslating: false,
            recognitionData: null
        }
        chatState.value = {
            chatItems: [],
            filteredChatItems: [],
            highlightedIndex: -1
        }
    }

    return {
        audioState,
        chatState,
        speakerState,
        dialogState,
        searchState,
        updateAudioState,
        updateChatState,
        updateSpeakerState,
        updateDialogState,
        updateSearchState,
        resetState
    }
})