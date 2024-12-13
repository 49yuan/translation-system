<template>
    <div class="container">
        <el-card class="audio-upload-card">
            <div class="audio-upload-container">
                <el-input type="textarea" :rows="10" v-model="recognitionResult" placeholder="识别结果将显示在这里">
                </el-input>
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
            </div>
            <audio ref="audioPlayer" controls></audio>
        </el-card>
    </div>
</template>
<script>
import { audio_recognition_hkTozh, audio_recognition_hkToen } from '@/api/speech_recognition'

export default {
    name: 'SpeechRecognition',
    data() {
        return {
            fileList: [],
            audioFile: null,
            audioName: '',
            recognitionResult: '', // 用于存储识别结果
        };
    },
    methods: {
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
            this.recognitionResult = response.data['translated_text']
        },
        handleError(error, file, fileList) {
            this.$message.error('音频上传失败');
        },
        hkTozh() {
            if (!this.audioFile) {
                this.$message.error('请先选择音频文件');
                return;
            }
            audio_recognition_hkTozh(this.audioFile)
                .then(res => {
                    console.log(res.data)
                    this.recognitionResult = res.data['translated_text']
                })
        },
        hkToen() {
            if (!this.audioFile) {
                this.$message.error('请先选择音频文件');
                return;
            }
            audio_recognition_hkToen(this.audioFile)
                .then(res => {
                    console.log(res.data)
                    this.recognitionResult = res.data['translated_text']
                })
        },
    },
    watch: {
        fileList(newVal) {
            // 监听文件列表变化，这里不需要做任何操作
        },
    },
};
</script>
  
<style scoped>
.container {
    position: relative;
    height: 100vh;
}

.audio-upload-card {
    width: 800px;
    height: 500px;
    margin: auto;
    /* 水平居中 */
    position: absolute;
    top: 30%;
    /* 向下移动30%的高度 */
    left: 50%;
    transform: translate(-50%, -30%);
    /* 调整位置确保准确在某个位置 */
}

.audio-upload-container {
    padding: 20px;
}

.button {
    margin-top: 30px;
}
</style>