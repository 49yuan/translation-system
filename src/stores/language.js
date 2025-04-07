import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLanguageStore = defineStore('language', () => {
    // 文件列表状态
    const fileState = ref({
        fileList: [],
        uploadProgress: 0
    })

    // 识别结果状态
    const resultState = ref({
        results: [],
        minnanResults: [],
        innanResults: [],
        displaySection: 'none' // 'results', 'minnanResults', 'none'
    })

    // 加载状态
    const loadingState = ref({
        isIdentifying: false,
        isMinnanIdentifying: false
    })

    // 更新文件列表
    const updateFileList = (files) => {
        fileState.value.fileList = files
    }

    // 更新识别结果
    const updateResults = (results) => {
        resultState.value.results = results
        resultState.value.minnanResults = []
        resultState.value.innanResults = []
        resultState.value.displaySection = results.length > 0 ? 'results' : 'none'
    }

    // 更新闽南语识别结果
    const updateMinnanResults = (minnanResults, innanResults) => {
        resultState.value.minnanResults = minnanResults
        resultState.value.innanResults = innanResults
        resultState.value.results = []
        resultState.value.displaySection = minnanResults.length > 0 ? 'minnanResults' : 'none'
    }

    // 重置状态
    const resetState = () => {
        fileState.value = {
            fileList: [],
            uploadProgress: 0
        }
        resultState.value = {
            results: [],
            minnanResults: [],
            innanResults: [],
            displaySection: 'none'
        }
        loadingState.value = {
            isIdentifying: false,
            isMinnanIdentifying: false
        }
    }

    return {
        fileState,
        resultState,
        loadingState,
        updateFileList,
        updateResults,
        updateMinnanResults,
        resetState
    }
})