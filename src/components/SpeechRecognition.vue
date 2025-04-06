<template>
    <div class="container">
        <!-- <div class="tab">
            <button v-for="tab in tabs" :key="tab" :class="{ 'tab-button': true, active: currentTab === tab }"
                @click="currentTab = tab">
                {{ tab }}
            </button>
        </div> -->
        <el-card class="audio-upload-card">
            <div class="audio-upload-container">
                <!-- <div v-if="currentTab === '音频识别'" class="content" id="audio"> -->
                <div class="text_area" v-html="recognitionResult" placeholder="识别结果将显示在这里">
                </div>
                <!-- <div class="button1">
                    <el-button type="primary" @click="startRecording">开始录音</el-button>
                    <el-button type="success" @click="stopRecording" :disabled="!isRecording">停止录音</el-button>
                </div> -->
                <div style="height: 20px;"></div>
                <div class="audio-control-container">
                    <audio ref="audioPlayer" controls></audio>
                    <div class="button-group">
                        <el-upload :on-success="handleSuccess" :on-error="handleError" :before-upload="beforeUpload"
                            :file-list="fileList" name="audio" list-type="text" accept="audio/*" :auto-upload="false"
                            :on-change="handleChange" class="button">
                            <template #trigger>
                                <el-button type="primary" class="f-button"><el-icon>
                                        <FolderOpened />
                                    </el-icon>选择音频文件</el-button>
                            </template>
                            <el-button style="margin-left: 10px;" type="primary" class="f-button margin-bottom-1"
                                :loading="isTranslating" :disabled="isTranslating" @click="hkTozh">
                                <el-icon>
                                    <Connection />
                                </el-icon>
                                {{ isTranslating ? '翻译中...' : '中文翻译' }}
                            </el-button>
                            <el-dropdown style="margin-left: 10px;" @command="handleExportCommand">
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
                            <!-- <el-button style="margin-left: 10px;" type="success">导出</el-button> -->
                            <!-- <el-button style="margin-left: 10px;" type="success" @click="hkToen">英文翻译</el-button> -->
                            <!-- <div style="margin-top: 15px;">
                            <el-tag>{{ audioName }}</el-tag>
                        </div> -->
                        </el-upload>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>
<script>
import { audio_recognition_hkTozh } from '@/api/speech_recognition'
import axios from "axios";
export default {
    name: 'SpeechRecognition',
    data() {
        return {
            fileList: [],
            audioFile: null,
            audioName: '',
            recognitionResult: '', // 用于存储识别结果
            isRecording: false,
            audioSrc: '',
            mediaRecorder: null,
            chunks: [],
            // currentTab: '音频识别', // 默认显示音频识别界面
            // tabs: ['音频识别', '视频识别'],
            // videoFile: null,
            // videoName: '',
            // videoSrc: '',
            // subtitles: [],
            // videoFileList: [],
            highlightedTexts: [], // 用于存储高亮文本和时间戳
            isTranslating: false, // 控制翻译按钮的状态
            recognitionData: '',
        };
    },
    methods: {
        startRecording() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    this.mediaRecorder = new MediaRecorder(stream);
                    this.mediaRecorder.start();
                    this.isRecording = true;
                    this.mediaRecorder.ondataavailable = e => {
                        if (e.data.size > 0) {
                            this.chunks.push(e.data);
                        }
                    };
                    this.mediaRecorder.onstop = () => {
                        // 创建 Blob 对象
                        const blob = new Blob(this.chunks, { type: 'audio/wav' });
                        // 将 Blob 转换为 File 对象
                        this.audioFile = new File([blob], '录音.wav', { type: 'audio/wav' });
                        this.audioName = '录音.wav';
                        this.audioSrc = URL.createObjectURL(this.audioFile);
                        this.chunks = [];
                        this.isRecording = false;
                    };
                })
                .catch(err => {
                    console.error("Error accessing media devices.", err);
                });
        },
        stopRecording() {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        },
        beforeUpload(file) {
            const isAudio = file.type.startsWith('audio/');
            if (!isAudio) {
                this.$message.error('请上传音频文件!');
            }
            // const isLt10M = file.size / 1024 / 1024 < 10;
            // if (!isLt10M) {
            //     this.$message.error('上传文件大小不能超过 10MB!');
            // }
            // return isAudio && isLt10M;
            return isAudio;
        },
        handleChange(file, fileList) {
            this.audioFile = file.raw; // 假设一次只上传一个文件
            this.audioName = file.name;
            this.fileList = [file];
            if (this.audioFile) {
                const audioPlayer = this.$refs.audioPlayer;
                audioPlayer.src = URL.createObjectURL(this.audioFile);
            }
        },
        handleSuccess(response, file, fileList) {
            this.$message.success('音频上传成功');
            this.recognitionResult = response.data['result']
        },
        handleError(error, file, fileList) {
            this.$message.error('音频上传失败');
        },
        // 原本的音频翻译方法
        // hkTozh() {
        //     if (!this.audioFile || !(this.audioFile instanceof File)) {
        //         this.$message.error('请先选择音频文件');
        //         return;
        //     }
        //     console.log(this.audioFile)
        //     audio_recognition_hkTozh(this.audioFile)
        //         .then(res => {
        //             console.log(res.data)
        //             this.recognitionResult = res.data.data['result']
        //         }).catch(error => {
        //             console.error('音频识别失败:', error);
        //             this.$message.error('音频识别失败');
        //         });
        // },
        async hkTozh() {
            if (!this.audioFile || !(this.audioFile instanceof File)) {
                this.$message.error('请先选择音频文件');
                return;
            }
            // 开始翻译，设置按钮状态
            this.isTranslating = true;

            const formData = new FormData();
            formData.append('file', this.audioFile);

            try {
                const response = await axios.post('/speaker_diarization', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.code === 200) {
                    this.recognitionData = response.data.data;
                    const recognitionResults = response.data.data.recognition_result;
                    this.highlightedTexts = recognitionResults.map(item => ({
                        text: item.text,
                        speaker: item.speaker,
                        start_time: item.start_time,
                        end_time: item.end_time
                    }));
                    this.renderHighlightedText();
                } else {
                    this.$message.error('音频识别失败');
                }
            } catch (error) {
                console.error('音频识别失败:', error);
                this.$message.error('音频识别失败');
            } finally {
                // 翻译完成，恢复按钮状态
                this.isTranslating = false;
            }
        },
        renderHighlightedText() {
            let html = '';
            this.highlightedTexts.forEach((item, index) => {
                html += `<span class="text_e" data-start="${item.start_time}" data-end="${item.end_time}">${item.text}</span>`;
            });
            this.recognitionResult = html;
        },
        highlightText() {
            const audioPlayer = this.$refs.audioPlayer;
            audioPlayer.addEventListener('timeupdate', () => {
                const currentTime = audioPlayer.currentTime;
                const spans = document.querySelectorAll('.text_e');
                spans.forEach(span => {
                    const start = parseFloat(span.getAttribute('data-start'));
                    const end = parseFloat(span.getAttribute('data-end'));
                    if (currentTime >= start && currentTime <= end) {
                        span.classList.add('highlight');
                    } else {
                        span.classList.remove('highlight');
                    }
                });
            });
        },

        //导出
        exportFile(format) {
            if (!this.recognitionData) {
                this.$message.error('请先进行音频识别');
                return;
            }

            let url = '';
            if (format === 'excel') {
                url = '/export/diarization/excel';
            } else if (format === 'word') {
                url = '/export/recognition/word';
            } else {
                this.$message.error('无效的导出格式');
                return;
            }
            // 使用用户上传的音频文件名作为基础文件名
            const baseFilename = this.audioName.replace(/\.[^/.]+$/, ""); // 去掉文件扩展名
            const filename = `${baseFilename}.${format === 'excel' ? 'xlsx' : 'docx'}`; // 根据格式添加扩展名
            url += `?filename=${filename}`;
            let requestData;
            if (format === 'excel') {
                // Excel 导出请求数据
                requestData = {
                    speaker_num: this.recognitionData.speaker_num,
                    recognition_result: this.recognitionData.recognition_result.map(item => ({
                        text: item.text,
                        start_time: item.start_time,
                        end_time: item.end_time,
                        speakers: item.speaker.map(speaker => ({
                            name: speaker.name,
                            similarity: speaker.similarity,
                            speaker_id: speaker.speaker_id
                        }))
                    }))
                };
            } else if (format === 'word') {
                requestData = this.recognitionData.recognition_result.map(item => item.text).join('\n');
            }
            axios.post(url, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                responseType: 'blob'
            })
                .then(response => {
                    let mimeType = '';
                    if (format === 'excel') {
                        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    } else if (format === 'word') {
                        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    }

                    const blob = new Blob([response.data], { type: mimeType });
                    const downloadUrl = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = filename;
                    //link.setAttribute('download', `output.${format}`); // 设置文件名
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl); // 释放对象 URL
                    this.$message.success(`导出为 ${format} 成功`);
                })
                .catch(error => {
                    console.error('导出失败:', error);
                    this.$message.error('导出失败');
                });
        },
        handleExportCommand(command) {
            this.exportFile(command);
        },
        // hkToen() {
        //     if (!this.audioFile) {
        //         this.$message.error('请先选择音频文件');
        //         return;
        //     }
        //     audio_recognition_hkToen(this.audioFile)
        //         .then(res => {
        //             console.log(res.data)
        //             this.recognitionResult = res.data['result']
        //         })
        // },
        // 已转移
        // handleVideoChange(file, fileList) {
        //     this.videoFile = file.raw;
        //     this.videoName = file.name;
        //     this.videoFileList = [file];
        //     if (this.videoFile) {
        //         const videoPlayer = this.$refs.videoPlayer;
        //         videoPlayer.src = URL.createObjectURL(this.videoFile);
        //     }
        //     //这部分是因为禁用了auto-upload,后端启用时或许可以解除
        //     this.fetchSubtitles(); // 假设后端接口上传成功后返回字幕信息
        //     console.log(this.subtitles);
        // },
        // beforeVideoUpload(file) {
        //     const isVideo = file.type.startsWith('video/');
        //     if (!isVideo) {
        //         this.$message.error('请上传视频文件!');
        //     }
        //     const isLt100M = file.size / 1024 / 1024 < 100;
        //     if (!isLt100M) {
        //         this.$message.error('上传文件大小不能超过 100MB!');
        //     }
        //     return isVideo && isLt100M;
        // },
        // handleVideoSuccess(response, file, fileList) {
        //     this.$message.success('视频上传成功');
        //     this.fetchSubtitles(); // 假设后端接口上传成功后返回字幕信息
        //     console.log(this.subtitles);
        // },
        // handleVideoError(error, file, fileList) {
        //     this.$message.error('视频上传失败');
        // },
        // fetchSubtitles() {
        //     this.subtitles = [
        //         {
        //             text: "请点击翻译字幕按钮生成中文翻译",
        //             start_time: 0,
        //             end_time: 5,
        //             display: 'display'
        //         },
        //         {
        //             text: "出现这个代表后端翻译api还没正常获取",
        //             start_time: 5,
        //             end_time: 10,
        //             display: 'none'
        //         },
        //         // ... 其他字幕数据
        //     ];
        //     // 监听视频播放事件，显示对应字幕
        //     const videoPlayer = this.$refs.videoPlayer;
        //     videoPlayer.addEventListener('timeupdate', this.syncSubtitles);
        // },
        // syncSubtitles() {
        //     const currentTime = this.$refs.videoPlayer.currentTime;
        //     this.subtitles = this.subtitles.map((subtitle, index) => {
        //         if (currentTime >= subtitle.start_time && currentTime <= subtitle.end_time) {
        //             return { ...subtitle, display: 'block' };
        //         } else {
        //             return { ...subtitle, display: 'none' };
        //         }
        //     });
        // },
        // translateSubtitles() {
        //     // 调用后端接口翻译字幕
        //     // 假设后端接口返回翻译后的字幕信息
        //     // 更新 this.subtitles
        // },
        // beforeDestroy() {
        //     // 组件销毁前移除事件监听
        //     const videoPlayer = this.$refs.videoPlayer;
        //     videoPlayer.removeEventListener('timeupdate', this.syncSubtitles);
        // },
    },
    watch: {
        fileList(newVal) {
            // 监听文件列表变化，这里不需要做任何操作
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.highlightText();
        });
    }
};
</script>
  
<style scoped>
/* .tab {
    position: absolute;
    height: 35px;
    top: -35px;
    left: 0;
}

.tab-button {
    height: 100%;
    padding: 5px 10px;
    cursor: pointer;
    background-color: white;
    border: none;
    outline: none;
    border-top-right-radius: 5px;
    border-top-left-radius: 5px;
    box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12);
}

.tab-button.active {
    background-color: #ffd04b;
} */

.content {
    width: 100%;
    height: 100%;
    /* display: none; */
    /* 默认隐藏所有内容 */
}

#audio {
    display: block;
    /* 默认显示音频识别界面 */
}

.container {
    position: relative;
    width: 60%;
    height: 60vh;
    margin: auto;
    margin-top: 100px;
}

.audio-upload-card {
    width: 100%;
    height: 520px;
    left: 50%;
    border-top-left-radius: 0;
}

.audio-upload-container {
    padding: 15px;
}

.button1 {
    margin-top: 20px;
}

.button {
    margin-top: 10px;
}

.operation-area {
    margin-top: 20px;
}

.subtitle-area {
    margin-top: 20px;
    height: 60px;
    overflow-y: auto;
    background-color: #f5f5f5;
}

.subtitle-area li {
    list-style: none;
    padding: 3px;
}

video {
    width: 100%;
    height: 70%;
}

.text_area {
    width: 100%;
    height: 370px;
    overflow-y: auto;
    border-radius: 5px;
    border: #848484 1px solid;
    padding: 10px;
    box-sizing: border-box;
}

.audio-control-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.audio-control-container audio {
    flex: 1;
    margin-right: 10px;
}

.button-group {
    display: flex;
    align-items: center;
}

:deep(.el-upload-list) {
    max-width: 251px;
}

.margin-bottom-1 {
    margin-bottom: 5px;
}
</style>
<style>
.highlight {
    background-color: yellow;
}
</style>