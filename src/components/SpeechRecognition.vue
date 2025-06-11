<template>
    <div class="container">
        <el-card class="audio-upload-card">
            <div class="audio-upload-container">
                <div class="text_area" v-html="recognitionResult" placeholder="识别结果将显示在这里">
                </div>
                <div style="height: 20px;"></div>
                <div class="audio-control-container">
                    <audio ref="audioPlayer" controls></audio>
                    
                    <div class="button-group">
                        <el-tooltip content="启用后，优先使用缓存识别结果" placement="top">
                            <el-switch v-model="useCache" active-text="使用缓存" style="margin-right: 10px;"/>
                        </el-tooltip>
                        <el-select v-model="lang" placeholder="选择语言" style="width: 100px; margin-left: 10px;">
                            <el-option label="中文" value="zh" />
                            <el-option label="英文" value="en" />
                        </el-select>
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
                                <el-icon v-if="!isTranslating">
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
                        </el-upload>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
import { audio_recognition_hkTozh } from '@/api/speech_recognition'
import axios from '@/api/axios';
import { useTranslationStore } from '@/stores/translation'
import { storeToRefs } from 'pinia'
import { useCache } from 'element-plus/es/components/virtual-list/src/hooks/use-cache';

export default {
    name: 'SpeechRecognition',
    setup() {
        const translationStore = useTranslationStore()
        const { audioTranslation } = storeToRefs(translationStore)

        return {
            translationStore,
            audioTranslation
        }
    },
    data() {
        return {
            lang:'zh',
            isRecording: false,
            mediaRecorder: null,
            chunks: [],
            isTranslating: false,
            useCache: true,
        };
    },
    computed: {
        fileList: {
            get() {
                return this.audioTranslation.fileList
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    fileList: value
                })
            }
        },
        audioFile: {
            get() {
                return this.audioTranslation.audioFile
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    audioFile: value
                })
            }
        },
        audioName: {
            get() {
                return this.audioTranslation.audioName
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    audioName: value
                })
            }
        },
        recognitionResult: {
            get() {
                return this.audioTranslation.recognitionResult
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    recognitionResult: value
                })
            }
        },
        highlightedTexts: {
            get() {
                return this.audioTranslation.highlightedTexts
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    highlightedTexts: value
                })
            }
        },
        recognitionData: {
            get() {
                return this.audioTranslation.recognitionData
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    recognitionData: value
                })
            }
        },
        audioSrc: {
            get() {
                return this.audioTranslation.audioSrc
            },
            set(value) {
                this.translationStore.saveAudioTranslationState({
                    ...this.audioTranslation,
                    audioSrc: value
                })
            }
        }
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
                        const blob = new Blob(this.chunks, { type: 'audio/wav' });
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
            return isAudio;
        },
        handleChange(file, fileList) {
            this.audioFile = file.raw;
            this.audioName = file.name;
            this.fileList = [file];
            if (this.audioFile) {
                const audioPlayer = this.$refs.audioPlayer;
                this.audioSrc = URL.createObjectURL(this.audioFile);
                audioPlayer.src = this.audioSrc;
            }
        },
        handleSuccess(response, file, fileList) {
            this.$message.success('音频上传成功');
            this.recognitionResult = response.data['result']
        },
        handleError(error, file, fileList) {
            this.$message.error('音频上传失败');
        },
        async hkTozh() {
            if (!this.audioFile || !(this.audioFile instanceof File)) {
                this.$message.error('请先选择音频文件');
                return;
            }
            this.isTranslating = true;

            const formData = new FormData();
            formData.append('file', this.audioFile);
            formData.append('lang', this.lang || 'zh');
            formData.append("use_cache", this.useCache);

            try {
                const response = await axios.post('/web/speaker_diarization', formData, {
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
        exportFile(format) {
            if (!this.recognitionData) {
                this.$message.error('请先进行音频识别');
                return;
            }

            let url = '';
            if (format === 'excel') {
                url = '/web/export/diarization/excel';
            } else if (format === 'word') {
                url = '/web/export/recognition/word';
            } else {
                this.$message.error('无效的导出格式');
                return;
            }

            const baseFilename = this.audioName.replace(/\.[^/.]+$/, "");
            const filename = `${baseFilename}.${format === 'excel' ? 'xlsx' : 'docx'}`;
            url += `?filename=${filename}`;

            let requestData;
            if (format === 'excel') {
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
                    let mimeType = format === 'excel'
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

                    const blob = new Blob([response.data], { type: mimeType });
                    const downloadUrl = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);
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
    },
    watch: {
        fileList(newVal) {
            // 监听文件列表变化
        },
    },
    mounted() {
        // 恢复音频播放器状态
        if (this.audioSrc && this.$refs.audioPlayer) {
            this.$refs.audioPlayer.src = this.audioSrc;
        }

        this.$nextTick(() => {
            this.highlightText();
        });
    },
    // 组件激活时恢复状态
    activated() {
        if (this.audioSrc && this.$refs.audioPlayer) {
            this.$refs.audioPlayer.src = this.audioSrc;
        }
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