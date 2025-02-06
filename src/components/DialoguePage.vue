<template>
    <div class="chat-container">
        <!-- 添加搜索框 -->
        <div class="search-box">
            <a class="search-btn" @click="searchChatItems">
                <img src="@/assets/search.png" alt="Search Icon">
            </a>
            <input class="search-txt" v-model="searchQuery" placeholder="请输入搜索关键词" @input="debouncedSearch"
                @keyup.enter="searchChatItems" />
        </div>
        <!-- 说话人识别 -->
        <el-card class="people">
            <h4>说话人识别</h4>
            <div style="height:300px;width: 220px;">
                <el-scrollbar style="height: 100%" class="speaker-list-container">
                    <div v-if="speakers.length > 0" class="speaker-list">
                        <div v-for="speaker in speakers" :key="speaker.name" class="speaker-card">
                            <div class="flex5">
                                <el-button type="primary" plain :class="{ selected: selectedSpeakers[speaker.name] }"
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
                <el-button type="primary" @click="openCreateSpeakerDialog">创建说话人</el-button>
            </div>
        </el-card>

        <!-- 添加语音数据的对话框 -->
        <div v-if="addVoiceDialogVisible" class="confirm-dialog">
            <el-card class="dialog-card">
                <div class="dialog-header">
                    <h3>为 {{ selectedSpeaker.name }} 添加更多语音</h3>
                </div>
                <div class="dialog-body">
                    <el-button type="primary" class="upload-button" @click="triggerAddVoiceUpload">
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
        <div v-if="createSpeakerDialogVisible" class="confirm-dialog">
            <el-card class="dialog-card">
                <div class="dialog-header">
                    <h3>创建新的说话人</h3>
                </div>
                <div class="dialog-body">
                    <el-input class="new-name" v-model="newSpeakerName" placeholder="请输入说话人名称"></el-input>
                    <el-button type="primary" class="upload-button" @click="triggerSpeakerUpload">
                        选择文件
                    </el-button>
                    <input type="file" ref="speakerInput" @change="handleSpeakerFileUpload" multiple
                        style="display: none;" />
                </div>
                <div class="dialog-footer">
                    <el-button type="primary" @click="createSpeaker">确定</el-button>
                    <el-button @click="closeCreateSpeakerDialog">取消</el-button>
                </div>
            </el-card>
        </div>
        <div class="menu">
            <el-button type="primary" @click="triggerFileInput" :loading="isTranlation" :disabled="isTranlation">{{
                isTranlation ?
                '翻译中...' : '选择音频文件' }}</el-button>
            <input type="file" @change="handleFileUpload" style="display: none;" ref="fileInput" />
            <audio ref="audioPlayer" :src="audioSrc" @loadedmetadata="setAudioDuration" @timeupdate="onTimeUpdate"
                controls></audio>
        </div>
        <div class="chat-list" ref="chatList">
            <div v-for="(item, index) in filteredChatItems" :key="index" class="chat-item-box">
                <div class="avatar" :style="{ backgroundColor: item.color }">
                    <img src="@/assets/user.png" alt="User Icon">
                </div>
                <div class="content" @dblclick="seekAudio(item.start_time)"
                    :class="{ 'highindex': highlightedIndex === index }">
                    <div class="speaker">{{ item.speaker.name }}<span>{{ item.formatTime }}</span></div>
                    <div class="main-content" v-html="item.text"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const audioSrc = ref(null);
const audioPlayer = ref(null);
const chatItems = ref([]);
const filteredChatItems = ref([]);
const speakerColors = reactive({
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
});
const fileInput = ref(null);
const highlightedIndex = ref(-1);
const newSpeakerName = ref('');
const speakerFiles = ref([]);
const addVoiceFiles = ref([]);
const addVoiceDialogVisible = ref(false);
const createSpeakerDialogVisible = ref(false);
const selectedSpeaker = ref(null); // 当前选中的说话人
const speakers = ref([]); // 存储说话人列表
const selectedSpeakers = reactive({}); // 存储选中状态
const searchQuery = ref(''); // 搜索框的内容
const isTranlation = ref(false);
// 定义文件输入框的引用
const addVoiceInput = ref(null);
const speakerInput = ref(null);

// 触发文件选择的方法
const triggerAddVoiceUpload = () => {
    addVoiceInput.value.click(); // 触发隐藏的文件输入框
};

const triggerSpeakerUpload = () => {
    speakerInput.value.click(); // 触发隐藏的文件输入框
};

// 函数用于生成随机颜色
function generateRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

// 触发文件输入框
function triggerFileInput() {
    fileInput.value.click();
}

// 文件上传处理
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        // 获取选中的说话人 id
        const selectedSpeakerIds = Object.keys(selectedSpeakers)
            .filter(name => selectedSpeakers[name])
            .map(name => speakers.value.find(speaker => speaker.name === name)?.id);

        // 如果有选中的说话人，添加到 formData
        if (selectedSpeakerIds.length > 0) {
            for (let i = 0; i < selectedSpeakerIds.length; i++) {
                formData.append('speaker_ids', selectedSpeakerIds[i]);
            }
        }

        audioSrc.value = URL.createObjectURL(file);
        isTranlation.value = true;
        axios.post('/speaker_diarization', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                if (response.data.code === 200) {
                    chatItems.value = response.data.data.recognition_result.map((item, index) => {
                        const speaker = item.speaker[0];
                        return {
                            ...item,
                            color: speakerColors[speaker.speaker_id],
                            formatTime: `${(Math.floor(item.start_time / 60)).toString().padStart(2, '0')}:${(item.start_time % 60).toFixed(2).toString().padStart(2, '0')}`,
                            speaker: speaker
                        };
                    });
                    filteredChatItems.value = chatItems.value.map(item => ({ ...item }));
                }
            })
            .catch(error => {
                console.error('Failed to fetch data:', error);
                alert('文件上传失败');
            }).finally(() => {
                isTranlation.value = false;
            });
    }
}

// 音频播放控制
function seekAudio(timestamp) {
    if (audioPlayer.value) {
        audioPlayer.value.currentTime = timestamp + 0.01;
    }
}

function onTimeUpdate() {
    const currentTime = audioPlayer.value.currentTime;
    highlightedIndex.value = chatItems.value.findIndex(item =>
        currentTime >= item.start_time && currentTime <= item.end_time
    );
}

// 获取说话人列表
async function fetchSpeakers() {
    try {
        const response = await axios.get('/speaker');
        if (response.data.code === 200) {
            speakers.value = response.data.data.result;
            speakers.value.forEach(speaker => {
                selectedSpeakers[speaker.name] = false;
            });
        } else {
            alert(response.data.msg);
        }
    } catch (error) {
        console.error('获取说话人列表失败:', error);
        alert('获取说话人列表失败');
    }
}
function selectSpeaker(speakerName) {
    selectedSpeakers[speakerName] = !selectedSpeakers[speakerName];
}
// 创建说话人
function createSpeaker() {
    if (!newSpeakerName.value) {
        alert('请输入说话人名称');
        return;
    }

    const formData = new FormData();
    //formData.append('name', newSpeakerName.value);

    for (let i = 0; i < speakerFiles.value.length; i++) {
        formData.append('file_array', speakerFiles.value[i]);
    }

    axios.post(`/speaker?name=${newSpeakerName.value}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
        .then(response => {
            if (response.data.code === 200) {
                alert('创建成功');
                fetchSpeakers(); // 刷新说话人列表
                closeCreateSpeakerDialog();
            } else {
                alert(response.data.msg);
            }
        })
        .catch(error => {
            console.error('创建说话人失败:', error);
            alert('创建说话人失败');
        });
}
// 处理添加语音文件上传
function handleAddVoiceFileUpload(event) {
    const files = event.target.files;
    if (files) {
        addVoiceFiles.value = files; // 更新 addVoiceFiles
        //console.log("添加语音文件成功，文件数量:", addVoiceFiles.value.length);
    }
}

// 处理说话人文件上传
function handleSpeakerFileUpload(event) {
    const files = event.target.files;
    if (files) {
        speakerFiles.value = files; // 更新 speakerFiles
        //console.log("说话人文件上传成功，文件数量:", speakerFiles.value.length);
    }
}
// 打开和关闭对话框
function openAddVoiceDialog(speaker) {
    selectedSpeaker.value = speaker;
    addVoiceDialogVisible.value = true;
}

function closeAddVoiceDialog() {
    addVoiceDialogVisible.value = false;
    addVoiceFiles.value = [];
}

function openCreateSpeakerDialog() {
    createSpeakerDialogVisible.value = true;
    newSpeakerName.value = '';
    speakerFiles.value = [];
}

function closeCreateSpeakerDialog() {
    createSpeakerDialogVisible.value = false;
}

// 添加语音数据到说话人
function addVoiceToSpeaker() {
    if (!selectedSpeaker.value) {
        alert('请选择说话人');
        return;
    }

    const formData = new FormData();
    console.log(addVoiceFiles.value.length);
    for (let i = 0; i < addVoiceFiles.value.length; i++) {
        formData.append('file_array', addVoiceFiles.value[i]);
    }

    axios.put(`/speaker/add_voice?speaker_id=${selectedSpeaker.value.id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
        .then(response => {
            if (response.data.code === 200) {
                alert('添加成功');
                closeAddVoiceDialog();
            } else {
                alert(response.data.msg);
            }
        })
        .catch(error => {
            console.error('添加语音数据失败:', error);
            alert('添加语音数据失败');
        });
}

// 搜索功能
function searchChatItems() {
    if (searchQuery.value) {
        const regex = new RegExp(searchQuery.value, 'gi');
        filteredChatItems.value = chatItems.value.map(item => ({
            ...item,
            text: item.text.replace(regex, match => `<span class="highlight">${match}</span>`)
        }));
    } else {
        filteredChatItems.value = chatItems.value.map(item => ({ ...item }));
    }
}
// 防抖函数
function debouncedSearch() {
    setTimeout(() => {
        searchChatItems();
    }, 300);
}

// 初始化
onMounted(fetchSpeakers);

// const handleFileUpload = event => {
//     const file = event.target.files[0];
//     if (file) {
//         // 创建一个URL对象，指向选择的文件
//         audioSrc.value = URL.createObjectURL(file);
//         const mockData = {
//             "code": 200,
//             "router": "/api/web/speaker_diarization",
//             "data": {
//                 "speaker_num": 4,
//                 "recognition_result": [
//                     {
//                         "text": " 很高興能夠和幾位同學一起來討論 互聯網企業如何決勝 全球化新高低這個話題 ",
//                         "speaker": "SPEAKER_00",
//                         "start_time": 0.03096875,
//                         "end_time": 10.172843750000002
//                     },
//                     {
//                         "text": "第二塊其實是遊戲平台 所謂遊戲平台 簡單來說就是商店家社區的模式 ",
//                         "speaker": "SPEAKER_02",
//                         "start_time": 10.172843750000002,
//                         "end_time": 19.977218750000002
//                     },
//                     {
//                         "text": " 我们随着整個业务的托照 会发生跟阿里云有非常紧密的联系 因为剛開始伟光在介绍的时候也讲 阿里云也是阿里巴巴的云 所以这个过程中 一會儿也可以稍微展开跟大家讲下 我们跟云是怎麼一路走來的 ",
//                         "speaker": "SPEAKER_03",
//                         "start_time": 19.977218750000002,
//                         "end_time": 35.78909375
//                     },
//                     {
//                         "text": " 的确 對互联网公司而言 如果不能复杂人口 我想整个公司就失去了所有的动力 不知道各位怎麼看 我们最大的问题 是不是效率优先 是 否则 是 讲一个最关键的 你們是怎麼克服这些挑战的 ",
//                         "speaker": "SPEAKER_00",
//                         "start_time": 36.05909375,
//                         "end_time": 62.384093750000005
//                     },
//                     {
//                         "text": "因为其实我们最近一直在做海外业务 所以说我们碰到一些问题 可以一起分享出來 給大家一起探讨 ",
//                         "speaker": "SPEAKER_02",
//                         "start_time": 64.37534375,
//                         "end_time": 72.82971875
//                     },
//                     {
//                         "text": "最近一直在做海外業務 所以說我們碰到一些問題 可以一起分享出來 給大家一起探討 ",
//                         "speaker": "SPEAKER_00",
//                         "start_time": 65.50596875000001,
//                         "end_time": 72.66096875000001
//                     },
//                     {
//                         "text": " 我們還是這個觀點 無論妳準備工作得有多充分 學習能力有多強 妳一個中國企業的負責人 其實在出海的時候 整體還是一個強勢做的過程 ",
//                         "speaker": "SPEAKER_02",
//                         "start_time": 73.15034375,
//                         "end_time": 90.22784375
//                     },
//                     {
//                         "text": " 是 ",
//                         "speaker": "SPEAKER_00",
//                         "start_time": 81.35159375,
//                         "end_time": 81.40221875
//                     },
//                     {
//                         "text": " 是 ",
//                         "speaker": "SPEAKER_03",
//                         "start_time": 90.22784375,
//                         "end_time": 90.44721875
//                     },
//                     {
//                         "text": " 不過他也很喜歡妳 ",
//                         "speaker": "SPEAKER_02",
//                         "start_time": 90.44721875,
//                         "end_time": 90.61596875000001
//                     },
//                     {
//                         "text": " 是 ",
//                         "speaker": "SPEAKER_03",
//                         "start_time": 90.61596875000001,
//                         "end_time": 90.70034375
//                     },
//                     {
//                         "text": "後來",
//                         "speaker": "SPEAKER_02",
//                         "start_time": 90.70034375,
//                         "end_time": 90.97034375000001
//                     },
//                     {
//                         "text": "或者脫到新加坡 印尼 越南等等這些地方 每一個地方走過去 都面臨的一個問題是 建戰的效率 怎麼樣能夠快速地把這個戰略建起來 ",
//                         "speaker": "SPEAKER_03",
//                         "start_time": 90.97034375000001,
//                         "end_time": 101.60159375
//                     },
//                     {
//                         "text": " 一方面我們當初剛好從2014年剛好開始 要出去的時候 國內就是三個北上管身 當在海外要同時開服 北美 美東 美西 歐洲 日本 我還記得那個時候 我們在海外如何去建立這種IDC的勘探 建設 基礎設施建設 輸入的部署 都是一個全新的挑戰 ",
//                         "speaker": "SPEAKER_01",
//                         "start_time": 101.60159375,
//                         "end_time": 122.96534375
//                     }
//                 ]
//             }
//         };
//         if (mockData.code === 200) {
//             chatItems.value = mockData.data.recognition_result.map((item, index) => ({
//                 ...item,
//                 color: speakerColors[item.speaker],
//                 formatTime: `${(Math.floor(item.start_time / 60)).toString().padStart(2, '0')}:${(item.start_time % 60).toFixed(2).toString().padStart(2, '0')
//                     }`
//             }));
//             filteredChatItems.value = chatItems.value.map(item => ({ ...item }))
//         }
//         console.log(chatItems);
//     }
// };
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

.avatar {
    margin-right: 10px;
    background-color: #eee;
    /* Default background color, will be overridden by dynamic style */
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
    width: 14%;
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
    background: #3d9dff;
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
    background-color: #3d9dff;
}

.speaker_items button.selected {
    background-color: #3d9dff;
    color: aliceblue;
}
</style>