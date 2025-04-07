<template>
    <div class="video-page">
        <div class="video-box">
            <el-card class="video-card" style="height: 560px; width: 100%;">
                <div style="width: 43vw;"></div>
                <video ref="videoPlayer" controls></video>
            </el-card>
        </div>

        <div class="fanyi-box">
            <el-card style="height: 560px;width: 100%;">
                <div class="text_area" v-html="recognitionResult || ''" placeholder="识别结果将显示在这里"></div>
                <div class="operation-area">
                    <el-slider v-model="videoTimestamp" :min="0" :max="videoDuration" range show-stops :marks="marks"
                        @change="handleTimestampChange" class="video-slider"></el-slider>
                    <div class="right-end">
                        <el-upload :before-upload="beforeVideoUpload" :on-change="handleVideoChange" :auto-upload="false"
                            :show-file-list="false" class="button">
                            <el-button type="primary" class="f-button">
                                <el-icon>
                                    <FolderOpened />
                                </el-icon>上传视频文件
                            </el-button>
                        </el-upload>
                        <el-button type="primary" class="f-button" @click="fetchSubtitles" :loading="isTranslating2"
                            :disabled="isTranslating2">
                            <el-icon v-if="!isTranslating2">
                                <Connection />
                            </el-icon>
                            {{ isTranslating2 ? '翻译中...' : '整体翻译' }}
                        </el-button>
                        <el-button style="margin-left: 10px;" type="primary" class="f-button" @click="selectSegment"
                            :loading="isTranslating1" :disabled="isTranslating1">
                            <el-icon v-if="!isTranslating1">
                                <Scissor />
                            </el-icon>
                            {{ isTranslating1 ? '翻译中...' : '选段翻译' }}
                        </el-button>
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { useTranslationStore } from '@/stores/translation'
import { storeToRefs } from 'pinia'

export default {
    name: 'VideoRecognition',
    setup() {
        const translationStore = useTranslationStore()
        const { videoTranslation } = storeToRefs(translationStore)

        return {
            translationStore,
            videoTranslation
        }
    },
    data() {
        return {
            isTranslating2: false,
            isTranslating1: false,
            ffmpeg: null
        };
    },
    computed: {
        videoFile: {
            get() {
                return this.videoTranslation.videoFile
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    videoFile: value
                })
            }
        },
        videoName: {
            get() {
                return this.videoTranslation.videoName
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    videoName: value
                })
            }
        },
        videoSrc: {
            get() {
                return this.videoTranslation.videoSrc
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    videoSrc: value
                })
            }
        },
        videoFileList: {
            get() {
                return this.videoTranslation.videoFileList
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    videoFileList: value
                })
            }
        },
        videoDuration: {
            get() {
                return this.videoTranslation.videoDuration
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    videoDuration: value
                })
            }
        },
        videoTimestamp: {
            get() {
                return this.videoTranslation.videoTimestamp
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    videoTimestamp: value
                })
            }
        },
        marks: {
            get() {
                return this.videoTranslation.marks
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    marks: value
                })
            }
        },
        recognitionResult: {
            get() {
                return this.videoTranslation.recognitionResult || ''
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    recognitionResult: value
                })
            }
        },
        subtitles: {
            get() {
                return this.videoTranslation.subtitles
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    subtitles: value
                })
            }
        },
        highlightedTexts: {
            get() {
                return this.videoTranslation.highlightedTexts
            },
            set(value) {
                this.translationStore.saveVideoTranslationState({
                    ...this.videoTranslation,
                    highlightedTexts: value
                })
            }
        }
    },
    methods: {
        initializeVideoPlayer() {
            const videoPlayer = this.$refs.videoPlayer;
            if (videoPlayer) {
                videoPlayer.addEventListener('timeupdate', this.syncSubtitles);
            }
        },
        handleVideoChange(file, fileList) {
            this.videoFile = file.raw;
            this.videoName = file.name;
            this.videoFileList = [file];

            if (this.videoFile) {
                this.videoSrc = URL.createObjectURL(this.videoFile);
                this.$nextTick(() => {
                    const videoPlayer = this.$refs.videoPlayer;
                    videoPlayer.src = this.videoSrc;
                    videoPlayer.addEventListener('timeupdate', this.syncSubtitles);

                    videoPlayer.addEventListener('loadedmetadata', () => {
                        this.videoDuration = videoPlayer.duration;
                        this.videoTimestamp = [0, this.videoDuration];
                        this.marks = {
                            0: '0s',
                            [this.videoDuration]: `${this.formatTime1(this.videoDuration)}`
                        };
                    });
                });

                this.recognitionResult = "";
            }
        },
        formatTime1(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        },
        handleTimestampChange() {
            const [start, end] = this.videoTimestamp;
            this.$refs.videoPlayer.currentTime = start;
        },
        beforeVideoUpload(file) {
            this.videoFileList = [];
            const isVideo = file.type.startsWith('video/');
            if (!isVideo) {
                this.$message.error('请上传视频文件!');
                return false;
            }
            return isVideo;
        },
        async fetchSubtitles() {
            const [start, end] = this.videoTimestamp;
            this.isTranslating2 = true;

            try {
                const wav = await this.extractAudio(start, end, this.videoFile);
                const blob = new Blob([wav.data], { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('file', blob, wav.name);

                const response = await axios.post('/speaker_diarization', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.code === 200) {
                    this.subtitles = response.data.data.recognition_result.map(subtitle => ({
                        text: subtitle.text,
                        start_time: subtitle.start_time,
                        end_time: subtitle.end_time,
                    }));
                    this.renderHighlightedText();
                } else {
                    this.$message.error('获取翻译结果失败');
                }
            } catch (error) {
                console.error('获取翻译结果失败:', error);
                this.$message.error('获取翻译结果失败');
            } finally {
                this.isTranslating2 = false;
            }
        },
        renderHighlightedText() {
            let html = '';
            let dot_num = 0;

            this.subtitles.forEach((subtitle) => {
                html += `<span class="text_e" data-start="${subtitle.start_time}" data-end="${subtitle.end_time}">${subtitle.text}</span>`;

                if (subtitle.text.split('。').length - 1 >= 3) {
                    dot_num = 3;
                } else if (subtitle.text.endsWith('。') || subtitle.text.endsWith('？')) {
                    dot_num += 1;
                }

                if (dot_num >= 3) {
                    html += `<br class="extra-line">`;
                    dot_num = 0;
                } else {
                    dot_num += 1;
                }
            });

            this.recognitionResult = html;
        },
        syncSubtitles() {
            const currentTime = this.$refs.videoPlayer.currentTime;
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
        },
        async selectSegment() {
            const [start, end] = this.videoTimestamp;
            this.isTranslating1 = true;

            try {
                const wav = await this.extractAudio(start, end, this.videoFile);
                const blob = new Blob([wav.data], { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('file', blob, wav.name);

                const response = await axios.post('/speaker_diarization', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.code === 200) {
                    this.subtitles = response.data.data.recognition_result.map(subtitle => ({
                        text: subtitle.text,
                        start_time: subtitle.start_time,
                        end_time: subtitle.end_time,
                    }));
                    this.renderHighlightedText();
                } else {
                    this.$message.error('选段翻译失败');
                }
            } catch (error) {
                console.error('选段翻译失败:', error);
                this.$message.error('选段翻译失败');
            } finally {
                this.isTranslating1 = false;
            }
        },
        formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },
        async extractAudio(start, end, prefile) {
            if (!this.ffmpeg) {
                this.ffmpeg = new FFmpeg();
                await this.ffmpeg.load({
                    coreURL: "/plugin/ffmpeg-core.js",
                    wasmURL: "/plugin/ffmpeg-core.wasm",
                });
            }

            await this.ffmpeg.writeFile("input.mp4", await fetchFile(prefile));
            const originName = prefile.name;
            const outputName = "output.wav";
            const startTime = this.formatTime(start);
            const endTime = this.formatTime(end);

            await this.ffmpeg.exec([
                '-ss', startTime,
                '-i', "input.mp4",
                '-to', endTime,
                '-vn',
                '-c:a', 'pcm_s16le',
                outputName
            ]);

            const data = await this.ffmpeg.readFile(outputName);
            return {
                data: data,
                name: originName.replace(/\.[^.]+$/, '_split.wav')
            };
        }
    },
    mounted() {
        this.initializeVideoPlayer();

        if (!this.videoTranslation.recognitionResult) {
            this.recognitionResult = ''
        }
        // 恢复视频播放器状态
        if (this.videoSrc && this.$refs.videoPlayer) {
            this.$refs.videoPlayer.src = this.videoSrc;
            this.$refs.videoPlayer.addEventListener('loadedmetadata', () => {
                if (this.videoDuration > 0) {
                    this.marks = {
                        0: '0s',
                        [this.videoDuration]: `${this.formatTime1(this.videoDuration)}`
                    };
                }
            });
        }
    },
    activated() {
        // 组件激活时恢复视频播放器状态
        if (this.videoSrc && this.$refs.videoPlayer) {
            this.$refs.videoPlayer.src = this.videoSrc;
        }
    },
    beforeUnmount() {
        // 组件销毁前移除事件监听
        const videoPlayer = this.$refs.videoPlayer;
        if (videoPlayer) {
            videoPlayer.removeEventListener('timeupdate', this.syncSubtitles);
        }

        // 清理FFmpeg资源
        if (this.ffmpeg) {
            this.ffmpeg.terminate();
        }
    }
}
</script>
<style scoped>
.video-page {
    display: flex;
    flex-direction: row;
}

.video-box {
    margin-right: 50px;
    flex: 1;
    height: 700px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.video-card {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

}

video {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}

.fanyi-box {
    flex: 1;
    height: 700px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text_area {
    margin-top: 20px;
    width: 100%;
    height: 420px;
    overflow-y: auto;
    border-radius: 5px;
    border: #848484 1px solid;
    padding: 10px;
    box-sizing: border-box;
}

.button {
    display: inline-block;
    margin-right: 10px;
}

.right-end {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
}
</style>
<style>
.highlight {
    background-color: yellow;
}

br.extra-line {
    display: block;
    margin-bottom: 1.2em;
    content: " ";
}
</style>