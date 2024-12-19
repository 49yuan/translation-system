<template>
    <div class="container">
        <div class="tab">
            <button v-for="tab in tabs" :key="tab" :class="{ 'tab-button': true, active: currentTab === tab }"
                @click="currentTab = tab">
                {{ tab }}
            </button>
        </div>
        <el-card class="audio-upload-card">
            <div class="audio-upload-container">
                <div v-if="currentTab === '音频识别'" class="content" id="audio">
                    <el-input type="textarea" :rows="10" v-model="recognitionResult" placeholder="识别结果将显示在这里">
                    </el-input>
                    <div class="button1">
                        <el-button type="primary" @click="startRecording">开始录音</el-button>
                        <el-button type="success" @click="stopRecording" :disabled="!isRecording">停止录音</el-button>
                    </div>
                    <el-upload :on-success="handleSuccess" :on-error="handleError" :before-upload="beforeUpload"
                        :file-list="fileList" name="audio" list-type="text" accept="audio/*" :auto-upload="false"
                        :on-change="handleChange" class="button">
                        <template #trigger>
                            <el-button type="primary">选择音频文件</el-button>
                        </template>
                        <el-button style="margin-left: 10px;" type="success" @click="hkTozh">中文翻译</el-button>
                        <!-- <el-button style="margin-left: 10px;" type="success" @click="hkToen">英文翻译</el-button> -->
                        <div style="margin-top: 15px;">
                            <el-tag>{{ audioName }}</el-tag>
                        </div>
                    </el-upload>

                    <audio ref="audioPlayer" controls></audio>
                </div>
                <!-- 视频识别内容 -->
                <div v-if="currentTab === '视频识别'" class="content" id="video">
                    <!-- 视频识别界面 -->
                </div>
            </div>
        </el-card>
    </div>
</template>
<script>
import { audio_recognition_hkTozh } from '@/api/speech_recognition'

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
            currentTab: '音频识别', // 默认显示音频识别界面
            tabs: ['音频识别', '视频识别'],
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
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                this.$message.error('上传文件大小不能超过 10MB!');
            }
            return isAudio && isLt10M;
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
        hkTozh() {
            if (!this.audioFile || !(this.audioFile instanceof File)) {
                this.$message.error('请先选择音频文件');
                return;
            }
            console.log(this.audioFile)
            audio_recognition_hkTozh(this.audioFile)
                .then(res => {
                    console.log(res.data)
                    this.recognitionResult = res.data.data['result']
                }).catch(error => {
                    console.error('音频识别失败:', error);
                    this.$message.error('音频识别失败');
                });
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
    },
    watch: {
        fileList(newVal) {
            // 监听文件列表变化，这里不需要做任何操作
        },
    },
};
</script>
  
<style scoped>
.tab {
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
}

.content {
    width: 100%;
    height: 100%;
    display: none;
    /* 默认隐藏所有内容 */
}

#audio {
    display: block;
    /* 默认显示音频识别界面 */
}

.container {
    position: relative;
    width: 800px;
    height: 550px;
    margin: auto;
    margin-top: 140px;
}

.audio-upload-card {
    width: 800px;
    height: 500px;
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
</style>