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
        <div class="people">
            <h4>说话人识别</h4>
            <div v-if="speakers.length > 0" class="speaker_items">
                <button v-for="speaker in speakers" :key="speaker.name"
                    :class="{ selected: selectedSpeakers[speaker.name] }" @click="selectSpeaker(speaker.name)">
                    {{ speaker.name }}
                </button>
            </div>
        </div>
        <div class="menu">
            <el-button type="primary" @click="triggerFileInput">选择音频文件</el-button>
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
                    <div class="speaker">{{ item.speaker }}<span>{{ item.formatTime }}</span></div>
                    <div class="main-content" v-html="item.text"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElButton, ElInput } from 'element-plus';
import axios from "axios";

const audioSrc = ref(null);
const chatItems = ref([]);
const speakerColors = reactive({
    // 预设的10个颜色
    SPEAKER_00: '#409EFF',
    SPEAKER_01: '#FFD04B',
    SPEAKER_02: '#8338EC',
    SPEAKER_03: '#15999C',
    SPEAKER_04: '#E76F51',
    SPEAKER_05: '#B4BEC9',
    SPEAKER_06: '#546E7A',
    SPEAKER_07: '#4CA8F5',
    SPEAKER_08: '#F9D428',
    SPEAKER_09: '#F28F43',
    SPEAKER_10: '#BDC3C7',
});
const audioPlayer = ref(null);
const fileInput = ref(null);
const highlightedIndex = ref(-1);

const triggerFileInput = () => {
    fileInput.value.click();
};
// 函数用于生成随机颜色
function generateRandomColor() {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    return randomColor;
}

// const handleFileUpload = event => {
//     const file = event.target.files[0];
//     if (file) {
//         const formData = new FormData();
//         formData.append('file', file);
//         audioSrc.value = URL.createObjectURL(file);

//         axios.post('/speaker_diarization', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             }
//         })
//             .then(response => {
//                 if (response.data.code === 200) {
//                     chatItems.value = response.data.data.recognition_result.map((item, index) => {
//                         // let color = speakerColors[speakerKey];
//                         // if (!color) {
//                         //     color = generateRandomColor();
//                         //     speakerColors[speakerKey] = color; // 存储生成的颜色以便下次使用
//                         // }
//                         return {
//                             ...item,
//                             color: speakerColors[item.speaker],
//                             formatTime: `${(Math.floor(item.start_time / 60)).toString().padStart(2, '0')}:${(item.start_time % 60).toFixed(2).toString().padStart(2, '0')}`
//                         };
//                     });
//                     filteredChatItems.value = chatItems.value.map(item => ({ ...item }));
//                 }
//             })
//             .catch(error => {
//                 console.error('Failed to fetch data:', error);
//             });
//     }
// };

const setAudioDuration = () => {
    // 设置音频总时长，初始化时间戳
};

const seekAudio = timestamp => {
    if (audioPlayer.value) {
        audioPlayer.value.currentTime = timestamp;
    }
};
const onTimeUpdate = () => {
    const currentTime = audioPlayer.value.currentTime;
    chatItems.value.forEach((item, index) => {
        if (currentTime >= item.start_time && currentTime <= item.end_time) {
            highlightedIndex.value = index; // 更新高亮显示的 chat-item 索引
        } else if (highlightedIndex.value === index) {
            highlightedIndex.value = -1; // 如果当前 chat-item 不再处于高亮时间范围内，取消高亮
        }
    });
}
const speakers = ref([]); // 存储说话人列表
const selectedSpeakers = ref({}); // 存储选中状态
// const fetchSpeakers = () => {
//     axios.get('/speaker')
//         .then(response => {
//             speakers.value = response.data.result;
//             // 初始化选中状态
//             speakers.value.forEach(speaker => {
//                 selectedSpeakers.value[speaker.name] = false;
//             });
//         })
//         .catch(error => {
//             console.error('获取说话人列表失败:', error);
//             // 这里可以添加错误处理，例如使用$message.error('获取说话人列表失败');
//         });
// };

const fetchSpeakers = () => {
    speakers.value = [{
        "id": 1,
        "name": "test1",
        "path": ""
    },
    {
        "id": 2,
        "name": "test2",
        "path": ""
    }];
    speakers.value.forEach(speaker => {
        selectedSpeakers.value[speaker.name] = false;
    });
}
const selectSpeaker = (speakerName) => {
    selectedSpeakers.value[speakerName] = !selectedSpeakers.value[speakerName];
};

onMounted(fetchSpeakers); // 组件挂载后获取说话人列表
// 搜索相关的状态和方法
const searchQuery = ref('');
const filteredChatItems = ref([]);
// 防抖函数，用于避免频繁触发搜索
const debouncedSearch = () => {
    setTimeout(() => {
        searchChatItems();
    }, 300);
};
const searchChatItems = () => {
    if (searchQuery.value) {
        console.log(`开始搜索：${searchQuery.value}`);
        const regex = new RegExp(searchQuery.value, 'gi');
        // 创建一个新的数组来存储处理后的chatItems
        filteredChatItems.value = chatItems.value.map(item => {
            const isMatch = regex.test(item.text);
            if (isMatch) {
                return {
                    ...item,
                    text: highlightText(item.text, regex),
                };
            }
            return item;
        });
    } else {
        filteredChatItems.value = chatItems.value.map(item => ({ ...item }));
    }
};

const highlightText = (text, regex) => {
    return text.replace(regex, (matched) => `<span class="highlight">${matched}</span>`);
};


const handleFileUpload = event => {
    const file = event.target.files[0];
    if (file) {
        // 创建一个URL对象，指向选择的文件
        audioSrc.value = URL.createObjectURL(file);
        const mockData = {
            "code": 200,
            "router": "/api/web/speaker_diarization",
            "data": {
                "speaker_num": 4,
                "recognition_result": [
                    {
                        "text": " 很高興能夠和幾位同學一起來討論 互聯網企業如何決勝 全球化新高低這個話題 ",
                        "speaker": "SPEAKER_00",
                        "start_time": 0.03096875,
                        "end_time": 10.172843750000002
                    },
                    {
                        "text": "第二塊其實是遊戲平台 所謂遊戲平台 簡單來說就是商店家社區的模式 ",
                        "speaker": "SPEAKER_02",
                        "start_time": 10.172843750000002,
                        "end_time": 19.977218750000002
                    },
                    {
                        "text": " 我们随着整個业务的托照 会发生跟阿里云有非常紧密的联系 因为剛開始伟光在介绍的时候也讲 阿里云也是阿里巴巴的云 所以这个过程中 一會儿也可以稍微展开跟大家讲下 我们跟云是怎麼一路走來的 ",
                        "speaker": "SPEAKER_03",
                        "start_time": 19.977218750000002,
                        "end_time": 35.78909375
                    },
                    {
                        "text": " 的确 對互联网公司而言 如果不能复杂人口 我想整个公司就失去了所有的动力 不知道各位怎麼看 我们最大的问题 是不是效率优先 是 否则 是 讲一个最关键的 你們是怎麼克服这些挑战的 ",
                        "speaker": "SPEAKER_00",
                        "start_time": 36.05909375,
                        "end_time": 62.384093750000005
                    },
                    {
                        "text": "因为其实我们最近一直在做海外业务 所以说我们碰到一些问题 可以一起分享出來 給大家一起探讨 ",
                        "speaker": "SPEAKER_02",
                        "start_time": 64.37534375,
                        "end_time": 72.82971875
                    },
                    {
                        "text": "最近一直在做海外業務 所以說我們碰到一些問題 可以一起分享出來 給大家一起探討 ",
                        "speaker": "SPEAKER_00",
                        "start_time": 65.50596875000001,
                        "end_time": 72.66096875000001
                    },
                    {
                        "text": " 我們還是這個觀點 無論妳準備工作得有多充分 學習能力有多強 妳一個中國企業的負責人 其實在出海的時候 整體還是一個強勢做的過程 ",
                        "speaker": "SPEAKER_02",
                        "start_time": 73.15034375,
                        "end_time": 90.22784375
                    },
                    {
                        "text": " 是 ",
                        "speaker": "SPEAKER_00",
                        "start_time": 81.35159375,
                        "end_time": 81.40221875
                    },
                    {
                        "text": " 是 ",
                        "speaker": "SPEAKER_03",
                        "start_time": 90.22784375,
                        "end_time": 90.44721875
                    },
                    {
                        "text": " 不過他也很喜歡妳 ",
                        "speaker": "SPEAKER_02",
                        "start_time": 90.44721875,
                        "end_time": 90.61596875000001
                    },
                    {
                        "text": " 是 ",
                        "speaker": "SPEAKER_03",
                        "start_time": 90.61596875000001,
                        "end_time": 90.70034375
                    },
                    {
                        "text": "後來",
                        "speaker": "SPEAKER_02",
                        "start_time": 90.70034375,
                        "end_time": 90.97034375000001
                    },
                    {
                        "text": "或者脫到新加坡 印尼 越南等等這些地方 每一個地方走過去 都面臨的一個問題是 建戰的效率 怎麼樣能夠快速地把這個戰略建起來 ",
                        "speaker": "SPEAKER_03",
                        "start_time": 90.97034375000001,
                        "end_time": 101.60159375
                    },
                    {
                        "text": " 一方面我們當初剛好從2014年剛好開始 要出去的時候 國內就是三個北上管身 當在海外要同時開服 北美 美東 美西 歐洲 日本 我還記得那個時候 我們在海外如何去建立這種IDC的勘探 建設 基礎設施建設 輸入的部署 都是一個全新的挑戰 ",
                        "speaker": "SPEAKER_01",
                        "start_time": 101.60159375,
                        "end_time": 122.96534375
                    }
                ]
            }
        };
        if (mockData.code === 200) {
            chatItems.value = mockData.data.recognition_result.map((item, index) => ({
                ...item,
                color: speakerColors[item.speaker],
                formatTime: `${(Math.floor(item.start_time / 60)).toString().padStart(2, '0')}:${(item.start_time % 60).toFixed(2).toString().padStart(2, '0')
                    }`
            }));
            filteredChatItems.value = chatItems.value.map(item => ({ ...item }))
        }
        console.log(chatItems);
    }
};
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
    left: 5%;
    margin-top: 80px;
    width: 11%;
    text-align: center;
}

h4 {
    margin: 10px;
}

.speaker_items {
    display: flex;
    flex-direction: column;
}

.speaker_items button {
    background: transparent;
    border-radius: 5px;
    border: 2px solid #3d9dff;
    cursor: pointer;
    width: 100%;
    height: 30px;
    margin: 5px 0;
    color: #3d9dff;
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