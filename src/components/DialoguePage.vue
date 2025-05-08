<template>
    <div class="chat-container">
        <!-- 搜索框 -->
        <div class="search-box">
            <a class="search-btn" @click="searchChatItems">
                <img src="@/assets/search.png" alt="Search Icon">
            </a>
            <input class="search-txt" v-model="searchState.searchQuery" @input="debouncedSearch"
                @keyup.enter="searchChatItems" placeholder="请输入搜索关键词" />
        </div>

        <!-- 说话人识别 -->
        <el-card class="people">
            <h4>说话人识别</h4>
            <div style="height:300px;width: 220px;">
                <el-scrollbar style="height: 100%" class="speaker-list-container">
                    <div v-if="speakerState.speakers.length > 0" class="speaker-list">
                        <div v-for="speaker in speakerState.speakers" :key="speaker.name" class="speaker-card">
                            <div class="flex5">
                                <el-button type="primary" plain
                                    :class="{ selected: speakerState.selectedSpeakers[speaker.name] }"
                                    @click="selectSpeaker(speaker.name)">
                                    {{ speaker.name }}
                                </el-button>
                            </div>
                            <div class="flex1">
                                <el-button class="add-info" @click="openAddVoiceDialog(speaker)" cicrle>
                                    +
                                </el-button>
                            </div>
                        </div>
                    </div>
                </el-scrollbar>
            </div>
            <div class="creatspeaker">
                <el-button type="primary" class="f-button" @click="openCreateSpeakerDialog">
                    <el-icon>
                        <DocumentAdd />
                    </el-icon>创建说话人
                </el-button>
            </div>
        </el-card>

        <!-- 添加语音数据的对话框 -->
        <div v-if="dialogState.addVoiceDialogVisible" class="confirm-dialog">
            <el-card class="dialog-card">
                <div class="dialog-header">
                    <h3>为 {{ dialogState.selectedSpeaker.name }} 添加更多语音</h3>
                </div>
                <div class="dialog-body">
                    <el-button type="primary" plain class="upload-button" @click="triggerAddVoiceUpload">
                        选择文件
                    </el-button>
                    <input type="file" ref="addVoiceInput" @change="handleAddVoiceFileUpload" multiple
                        style="display: none;" />
                </div>
                <div class="dialog-footer">
                    <el-button type="primary" @click="addVoiceToSpeaker">确定</el-button>
                    <el-button @click="closeAddVoiceDialog">取消</el-button>
                </div>
            </el-card>
        </div>

        <!-- 创建说话人的对话框 -->
        <div v-if="dialogState.createSpeakerDialogVisible" class="confirm-dialog">
            <el-card class="dialog-card">
                <div class="dialog-header">
                    <h3>创建新的说话人</h3>
                </div>
                <div class="dialog-body">
                    <el-input class="new-name" v-model="dialogState.newSpeakerName" placeholder="请输入说话人名称"></el-input>
                    <el-button type="primary" plain class="upload-button" @click="triggerSpeakerUpload">
                        选择文件
                    </el-button>
                    <input type="file" ref="speakerInput" @change="handleSpeakerFileUpload" multiple
                        style="display: none;" />
                </div>
                <div class="dialog-footer">
                    <el-button type="primary" class="f-button" @click="createSpeaker">确定</el-button>
                    <el-button @click="closeCreateSpeakerDialog">取消</el-button>
                </div>
            </el-card>
        </div>

        <div class="menu">
            <audio ref="audioPlayer" :src="audioState.audioSrc" @loadedmetadata="setAudioDuration"
                @timeupdate="onTimeUpdate" controls></audio>
            <el-select v-model="lang" placeholder="语言" style="width: 100px; margin-left: 10px;">
                    <el-option label="中文" value="zh" />
                    <el-option label="英文" value="en" />
            </el-select>

            <el-button type="primary" class="f-button" @click="triggerFileInput" :loading="audioState.isTranslating"
                :disabled="audioState.isTranslating">
                <el-icon v-if="!isTranslating">
                    <FolderOpened />
                </el-icon>
                {{ audioState.isTranslating ? '翻译中...' : '选择音频文件' }}
            </el-button>
            <input type="file" @change="handleFileUpload" style="display: none;" ref="fileInput" />
            <el-dropdown @command="handleExportCommand">
                <el-button type="primary" plain>
                    <el-icon>
                        <Share />
                    </el-icon>
                    导出<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="excel">导出为 Excel</el-dropdown-item>
                        <el-dropdown-item command="word">导出为 Word</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <div class="chat-list" ref="chatList">
            <div v-for="(item, index) in chatState.filteredChatItems" :key="index" class="chat-item-box">
                <div class="avatar" :style="{ backgroundColor: item.color }">
                    <span class="speaker-number">
                        {{ (item.speaker.speaker_id + 1).toString().padStart(2, '0') }}
                    </span>
                </div>
                <div class="content" @dblclick="seekAudio(item.start_time)"
                    :class="{ 'highindex': chatState.highlightedIndex === index }">
                    <div class="speaker">{{ item.speaker.name }}<span>{{ item.formatTime }}</span></div>
                    <div class="main-content" v-html="item.text"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import axios from '@/api/axios'

const chatStore = useChatStore()
const {
    audioState,
    chatState,
    speakerState,
    dialogState,
    searchState
} = storeToRefs(chatStore)

const audioPlayer = ref(null)
const fileInput = ref(null)
const addVoiceInput = ref(null)
const speakerInput = ref(null)
const lang = ref('zh') // 默认中文

// 生成随机颜色
const generateRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
}

// 触发文件输入框
const triggerFileInput = () => {
    fileInput.value.click()
}

// 文件上传处理
const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    chatStore.updateAudioState({
        audioName: file.name,
        isTranslating: true
    })

    const formData = new FormData()
    formData.append('file', file)

    // 添加说话人 ID（body）
    const selectedSpeakerIds = Object.keys(speakerState.value.selectedSpeakers)
        .filter(name => speakerState.value.selectedSpeakers[name])
        .map(name => speakerState.value.speakers.find(s => s.name === name)?.id)

    selectedSpeakerIds.forEach(id => {
        if (id) formData.append('speaker_ids', id)
    })

    // 传入 URL 查询参数
    const queryParams = new URLSearchParams({
        language: lang.value || 'zh',
        // 可选 start_time 和 end_time，以下为示例，可根据你界面上的滑块组件绑定动态值
        //start_time: '0',
        //end_time: '-1'
    })

    try {
        const response = await axios.post(`/web/speaker_diarization?${queryParams.toString()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response.data.code === 200) {
        const totalSpeakers = response.data.data.speaker_num
        for (let i = 0; i < totalSpeakers; i++) {
            if (!speakerState.value.speakerColors[i]) {
            speakerState.value.speakerColors[i] = generateRandomColor()
            }
        }

        const chatItems = response.data.data.recognition_result.map((item) => {
            const speaker = item.speaker[0]
            return {
            ...item,
            color: speakerState.value.speakerColors[speaker.speaker_id],
            formatTime: `${Math.floor(item.start_time / 60).toString().padStart(2, '0')}:${(item.start_time % 60).toFixed(2).toString().padStart(2, '0')}`,
            speaker
            }
        })

        chatStore.updateAudioState({
            audioSrc: URL.createObjectURL(file),
            recognitionData: response.data.data
        })

        chatStore.updateChatState({
            chatItems,
            filteredChatItems: [...chatItems]
        })
        }
    } catch (error) {
        console.error('Failed to fetch data:', error)
        alert('文件上传失败')
    } finally {
        chatStore.updateAudioState({ isTranslating: false })
    }
}

// 音频播放控制
const seekAudio = (timestamp) => {
    if (audioPlayer.value) {
        audioPlayer.value.currentTime = timestamp + 0.01
    }
}

const onTimeUpdate = () => {
    if (!audioPlayer.value) return
    const currentTime = audioPlayer.value.currentTime
    const highlightedIndex = chatState.value.chatItems.findIndex(item =>
        currentTime >= item.start_time && currentTime <= item.end_time
    )
    chatStore.updateChatState({ highlightedIndex })
}

// 导出功能
const exportFile = async (format) => {
    if (!audioState.value.recognitionData) {
        alert('请先进行音频识别')
        return
    }

    let url = ''
    if (format === 'excel') {
        url = '/web/export/diarization/excel'
    } else if (format === 'word') {
        url = '/web/export/diarization/word'
    } else {
        alert('无效的导出格式')
        return
    }

    const baseFilename = audioState.value.audioName.replace(/\.[^/.]+$/, "")
    const filename = `${baseFilename}.${format === 'excel' ? 'xlsx' : 'docx'}`
    url += `?filename=${filename}`

    const requestData = {
        speaker_num: audioState.value.recognitionData.speaker_num,
        recognition_result: audioState.value.recognitionData.recognition_result.map(item => ({
            text: item.text,
            start_time: item.start_time,
            end_time: item.end_time,
            speakers: item.speaker.map(speaker => ({
                name: speaker.name,
                similarity: speaker.similarity,
                speaker_id: speaker.speaker_id
            }))
        }))
    }

    try {
        const response = await axios.post(url, requestData, {
            headers: { 'Content-Type': 'application/json' },
            responseType: 'blob'
        })

        const mimeType = format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

        const blob = new Blob([response.data], { type: mimeType })
        const downloadUrl = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
        console.error('导出失败:', error)
        alert('导出失败')
    }
}

const handleExportCommand = (command) => {
    exportFile(command)
}

// 说话人相关方法
const fetchSpeakers = async () => {
    try {
        const response = await axios.get('/web/speaker')
        if (response.data.code === 200) {
            const speakers = response.data.data.result
            const selectedSpeakers = {}
            speakers.forEach(speaker => {
                selectedSpeakers[speaker.name] = false
            })

            chatStore.updateSpeakerState({
                speakers,
                selectedSpeakers
            })
        } else {
            alert(response.data.msg)
        }
    } catch (error) {
        console.error('获取说话人列表失败:', error)
        alert('获取说话人列表失败')
    }
}

const selectSpeaker = (speakerName) => {
    const updatedSelectedSpeakers = {
        ...speakerState.value.selectedSpeakers,
        [speakerName]: !speakerState.value.selectedSpeakers[speakerName]
    }
    // 使用 store 方法更新状态
    chatStore.updateSpeakerState({
        selectedSpeakers: updatedSelectedSpeakers
    })
}

// 对话框相关方法
const openAddVoiceDialog = (speaker) => {
    chatStore.updateDialogState({
        selectedSpeaker: speaker,
        addVoiceDialogVisible: true,
        addVoiceFiles: []
    })
}

const closeAddVoiceDialog = () => {
    chatStore.updateDialogState({
        addVoiceDialogVisible: false,
        addVoiceFiles: []
    })
}

const openCreateSpeakerDialog = () => {
    chatStore.updateDialogState({
        createSpeakerDialogVisible: true,
        newSpeakerName: '',
        speakerFiles: []
    })
}

const closeCreateSpeakerDialog = () => {
    chatStore.updateDialogState({
        createSpeakerDialogVisible: false,
        newSpeakerName: '',
        speakerFiles: []
    })
}

// 文件上传处理
const triggerAddVoiceUpload = () => {
    addVoiceInput.value.click()
}

const triggerSpeakerUpload = () => {
    speakerInput.value.click()
}

const handleAddVoiceFileUpload = (event) => {
    chatStore.updateDialogState({
        addVoiceFiles: event.target.files
    })
}

const handleSpeakerFileUpload = (event) => {
    chatStore.updateDialogState({
        speakerFiles: event.target.files
    })
}

// 创建说话人
const createSpeaker = async () => {
    if (!dialogState.value.newSpeakerName) {
        alert('请输入说话人名称')
        return
    }

    const formData = new FormData()
    for (let i = 0; i < dialogState.value.speakerFiles.length; i++) {
        formData.append('file_array', dialogState.value.speakerFiles[i])
    }

    try {
        const response = await axios.post(`/web/speaker?name=${dialogState.value.newSpeakerName}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response.data.code === 200) {
            alert('创建成功')
            fetchSpeakers()
            closeCreateSpeakerDialog()
        } else {
            alert(response.data.msg)
        }
    } catch (error) {
        console.error('创建说话人失败:', error)
        alert('创建说话人失败')
    }
}

// 添加语音到说话人
const addVoiceToSpeaker = async () => {
    if (!dialogState.value.selectedSpeaker) {
        alert('请选择说话人')
        return
    }

    const formData = new FormData()
    for (let i = 0; i < dialogState.value.addVoiceFiles.length; i++) {
        formData.append('file_array', dialogState.value.addVoiceFiles[i])
    }

    try {
        const response = await axios.put(
            `/web/speaker/add_voice?speaker_id=${dialogState.value.selectedSpeaker.id}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        if (response.data.code === 200) {
            alert('添加成功')
            closeAddVoiceDialog()
        } else {
            alert(response.data.msg)
        }
    } catch (error) {
        console.error('添加语音数据失败:', error)
        alert('添加语音数据失败')
    }
}

// 搜索功能
const searchChatItems = () => {
    if (searchState.value.searchQuery) {
        const regex = new RegExp(searchState.value.searchQuery, 'gi')
        const filteredChatItems = chatState.value.chatItems.map(item => ({
            ...item,
            text: item.text.replace(regex, match => `<span class="highlight">${match}</span>`)
        }))
        chatStore.updateChatState({ filteredChatItems })
    } else {
        chatStore.updateChatState({
            filteredChatItems: [...chatState.value.chatItems]
        })
    }
}

// 防抖函数
const debouncedSearch = () => {
    setTimeout(searchChatItems, 300)
}

// 初始化
onMounted(() => {
    // 恢复说话人列表
    if (speakerState.value.speakers.length === 0) {
        fetchSpeakers()
    }

    // 恢复音频播放状态
    if (audioState.value.audioSrc && audioPlayer.value) {
        audioPlayer.value.src = audioState.value.audioSrc
    }
})

// 组件激活时恢复状态
const onActivated = () => {
    if (audioState.value.audioSrc && audioPlayer.value) {
        audioPlayer.value.src = audioState.value.audioSrc
    }
}
</script>

<style scoped>
.menu {
    display: flex;
    flex-direction: row;
    gap: 0 20px;
}

.menu button {
    height: 36px;
    margin-top: 6px;
}

.menu audio {
    width: 500px;
    height: 50px;
    flex: 1;
}

.chat-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    gap: 20px;
}

.chat-list {
    flex-grow: 2;
    overflow-y: auto;
    height: 70vh;
    width: 66%;
    margin-top: 10px;
    margin-left: 100px;
}

.chat-item-box {
    display: flex;
    padding: 10px;
    cursor: pointer;
    margin-bottom: 20px;
}

/* .avatar {
    margin-right: 10px;
    background-color: #eee;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
}

.avatar img {
    width: 30px;
    height: 30px;
} */
.menu .el-select {
  margin-top: 6px;
  height: 36px;
}

.avatar {
    margin-right: 10px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
    font-weight: bold;
}

.speaker-number {
    font-size: 16px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.user-icon {
    color: white;
}

.content {
    margin-left: 2%;
    padding: 20px;
    width: 88%;
    border-radius: 5px;
    background-color: #f1f2f6;
}

.speaker {
    font-weight: bold;
    display: flex;
    justify-content: space-between;
}

.speaker span {
    color: #888888;
    font-weight: 400;
}

.main-content {
    white-space: pre-wrap;

}

.search-box {
    position: fixed;
    top: 200px;
    right: 50px;
    background-color: white;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    height: 24px;
    padding: 9px;
    border-radius: 40px;
    display: flex;
}

.search-txt {
    border: none;
    background: none;
    outline: none;
    padding: 0;
    color: #222;
    font-size: 16px;
    line-height: 20px;
    width: 0;
    transition: 0.4s;
}

.search-btn {
    color: #888888;
    font-size: 24px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: 0.4s;
}

.search-btn img {
    width: 24px;
    height: 24px;
}

.search-box:hover .search-txt {
    width: 200px;
    padding: 0 12px;
}

.search-txt:focus {
    width: 200px;
    padding: 0 12px;
}

.people {
    position: fixed;
    left: 4%;
    margin-top: 100px;
    width: 244px;
    text-align: center;
}

.speaker-list-container {
    /* overflow-y: auto; */
    max-height: 300px;
    padding-right: 20px;
}

.speaker-list {
    display: flex;
    flex-direction: column;
}

.speaker-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
}

/* .speaker-card button {
    background: transparent;
    border-radius: 5px;
    border: 2px solid #3d9dff;
    cursor: pointer;
    height: 30px;
    margin: 5px 0;
    color: #3d9dff;
    flex: 5;
} */

.speaker-card .selected {
    background: #3b82f6;
    color: white;
}

.creatspeaker {
    margin-top: 20px;
}

.speaker-card .flex1 {
    flex: 1;
}

.speaker-card .flex5 {
    flex: 5;
}

.speaker-card .flex5 button {
    width: 100%;
    margin: 3px 0;
}

.speaker-card .add-info {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 23px;
    margin-left: 10px;
}

h4 {
    margin: 10px;
}

.confirm-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.dialog-card {
    width: 400px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dialog-header {
    text-align: center;
    margin-bottom: 20px;
}

.dialog-body {
    margin-bottom: 20px;
}

.dialog-footer {
    text-align: right;
}

.new-name {
    margin-bottom: 10px;
}
</style>
<style>
.highlight {
    background-color: yellow;
}

.chat-list .highindex {
    background-color: #3b82f6;
}

.speaker_items button.selected {
    background-color: #3b82f6;
    color: aliceblue;
}
</style>