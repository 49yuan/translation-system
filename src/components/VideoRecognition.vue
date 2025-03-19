<template>
    <!-- <div v-if="currentTab === '视频识别'" class="content" id="video"> -->
    <div class="video-page">

        <div class="video-box">
            <el-card class="video-card" style="height: 560px; width: 100%;">
                <div style="width: 43vw;"></div>
                <video ref="videoPlayer" controls></video>
            </el-card>
        </div>

        <div class="fanyi-box">
            <el-card style="height: 560px;width: 100%;">
                <div class="text_area" v-html="recognitionResult" placeholder="识别结果将显示在这里">
                </div>
                <!-- <div class="subtitle-area">
                <ul>
                    <li v-for="(subtitle, index) in subtitles" :key="index" :style="{ 'display': subtitle.display }">
                        {{ subtitle.text }}
                    </li>
                </ul>
            </div> -->
                <div class="operation-area">
                    <el-slider v-model="videoTimestamp" :min="0" :max="videoDuration" range show-stops :marks="marks"
                        @change="handleTimestampChange" class="video-slider"></el-slider>
                    <div class="right-end">
                        <el-upload :before-upload="beforeVideoUpload" :on-change="handleVideoChange" :auto-upload="false"
                            :show-file-list="false" class="button">
                            <el-button type="primary" class="f-button"> <el-icon>
                                    <FolderOpened />
                                </el-icon>上传视频文件</el-button>
                        </el-upload>
                        <el-button type="primary" class="f-button" @click="fetchSubtitles" :loading="isTranslating2"
                            :disabled="isTranslating2">
                            <el-icon>
                                <Connection />
                            </el-icon>
                            {{
                                isTranslating2 ? '翻译中...' : '整体翻译' }}</el-button>
                        <el-button style="margin-left: 10px;" type="primary" class="f-button" @click="selectSegment"
                            :loading="isTranslating1" :disabled="isTranslating1"><el-icon>
                                <Scissor />
                            </el-icon> {{ isTranslating1 ? '翻译中...' : '选段翻译'
                            }}</el-button>
                    </div>
                    <!-- <div style="margin-top: 15px;">
                            <el-tag>{{ videoName }}</el-tag>
                        </div> -->
                </div>
            </el-card>
        </div>
    </div>
    <!-- </div> -->
</template>

<script>
import axios from 'axios';
//import Worker from 'worker-loader!@/workers/ffmpeg.worker.js'; // 引入 Web Worker
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
export default {
    name: 'VideoRecognition',
    data() {
        return {
            videoFile: null,
            videoName: '',
            videoSrc: '',
            subtitles: [],
            videoFileList: [],
            videoDuration: 0,
            videoTimestamp: [0, 0],
            marks: {},
            recognitionResult: '',
            highlightedTexts: [], // 用于存储高亮文本和时间戳
            isTranslating2: false,
            isTranslating1: false,
        };
    },
    methods: {
        initializeVideoPlayer() {
            console.log('Initializing video player');
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
                const videoPlayer = this.$refs.videoPlayer;
                videoPlayer.src = URL.createObjectURL(this.videoFile);
                // this.$nextTick(() => {
                //     this.initializeVideoPlayer(); // 确保 DOM 更新完成后初始化视频播放器
                // });
                this.$nextTick(() => {
                    videoPlayer.addEventListener('timeupdate', this.syncSubtitles);
                });
                this.$refs.videoPlayer.addEventListener('loadedmetadata', () => {
                    this.videoDuration = this.$refs.videoPlayer.duration;
                    this.videoTimestamp = [0, this.videoDuration];
                    this.marks = {
                        0: '0s',
                        [this.videoDuration]: `${this.formatTime1(this.videoDuration)}`
                    };
                });
            }
            //这部分是因为禁用了auto-upload,后端启用时或许可以解除
            // this.fetchSubtitles(); // 假设后端接口上传成功后返回字幕信息
            // console.log(this.subtitles);
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
            videoFileList = [];
            const isVideo = file.type.startsWith('video/');
            if (!isVideo) {
                this.$message.error('请上传视频文件!');
            }
            // const isLt100M = file.size / 1024 / 1024 < 100;
            // if (!isLt100M) {
            //     this.$message.error('上传文件大小不能超过 100MB!');
            // }
            return isVideo;
        },
        handleVideoSuccess(response, file, fileList) {
            this.$message.success('视频上传成功');
            //this.fetchSubtitles(); // 假设后端接口上传成功后返回字幕信息
            //console.log(this.subtitles);
        },
        handleVideoError(error, file, fileList) {
            this.$message.error('视频上传失败');
        },
        // fetchSubtitles() {
        //     this.subtitles = [
        //         {
        //             text: "请点击翻译字幕按钮生成中文翻译",
        //             start_time: 0,
        //             end_time: 5,
        //         },
        //         {
        //             text: "出现这个代表后端翻译api还没正常获取",
        //             start_time: 5,
        //             end_time: 10,
        //         },
        //         // ... 其他字幕数据
        //     ];
        //     this.renderHighlightedText();
        //     // 监听视频播放事件，显示对应字幕
        //     // const videoPlayer = this.$refs.videoPlayer;
        //     // videoPlayer.addEventListener('timeupdate', this.syncSubtitles);
        // },
        fetchSubtitles() {
            this.isTranslating2 = true;
            const formData = new FormData();
            formData.append('file', this.videoFile);

            try {
                axios.post('/speaker_diarization', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }).then(response => {
                    if (response.data.code === 200) {
                        const subtitles = response.data.data.recognition_result;
                        this.subtitles = subtitles.map(subtitle => ({
                            text: subtitle.text,
                            start_time: subtitle.start_time,
                            end_time: subtitle.end_time,
                        }));
                        this.renderHighlightedText();
                    } else {
                        this.$message.error('获取字幕失败');
                    }
                }).catch(error => {
                    console.error('获取字幕失败:', error);
                    this.$message.error('获取字幕失败');
                }).finally(() => {
                    this.isTranslating2 = false;
                });
            } catch (error) {
                console.error('获取字幕失败:', error);
                this.$message.error('获取字幕失败');
            }
        },
        renderHighlightedText() {
            let html = '';
            this.subtitles.forEach((subtitle, index) => {
                html += `<span class="text_e" data-start="${subtitle.start_time}" data-end="${subtitle.end_time}">${subtitle.text}</span>`;
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
        //     this.fetchSubtitles(); // 假设后端接口上传成功后返回字幕信息
        //     //console.log(this.subtitles);
        // },
        selectSegment() {
            const [start, end] = this.videoTimestamp;
            console.log(`选段翻译区域: ${start} - ${end}`);

            // 裁剪视频
            // this.clipTranslate(start, end, this.videoFile).then(processedVideo => {
            //     // 创建一个 Blob 对象
            //     const blob = new Blob([processedVideo], { type: 'video/mp4' });
            //     this.isTranslating1 = true;
            //     // 创建 FormData 并添加裁剪后的视频文件
            //     const formData = new FormData();
            //     formData.append('file', blob, 'segment.mp4');

            //     // 发送裁剪后的视频到后端
            //     axios.post('/speaker_diarization', formData, {
            //         headers: {
            //             'Content-Type': 'multipart/form-data'
            //         }
            //     }).then(response => {
            //         if (response.data.code === 200) {
            //             const subtitles = response.data.data.recognition_result;
            //             this.subtitles = subtitles.map(subtitle => ({
            //                 text: subtitle.text,
            //                 start_time: subtitle.start_time + start,
            //                 end_time: subtitle.end_time + start,
            //             }));
            //             this.renderHighlightedText();
            //         } else {
            //             this.$message.error('选段翻译失败');
            //         }
            //     }).catch(error => {
            //         console.error('选段翻译失败:', error);
            //         this.$message.error('选段翻译失败');
            //     }).finally(() => {
            //         this.isTranslating1 = false;
            //     });
            // }).catch(error => {
            //     console.error('裁剪视频失败:', error);
            //     this.$message.error('裁剪视频失败');
            // });
            const url = '/speaker_diarization' + `?start_time=${start}` + `&end_time=${end}`;
            const formData = new FormData();
            this.isTranslating1 = true;
            formData.append('file', this.videoFile);
            axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).then(response => {
                if (response.data.code === 200) {
                    const subtitles = response.data.data.recognition_result;
                    this.subtitles = subtitles.map(subtitle => ({
                        text: subtitle.text,
                        start_time: subtitle.start_time + start,
                        end_time: subtitle.end_time + start,
                    }));
                    this.renderHighlightedText();
                } else {
                    this.$message.error('选段翻译失败');
                }
            }).catch(error => {
                console.error('选段翻译失败:', error);
                this.$message.error('选段翻译失败');
            }).finally(() => {
                this.isTranslating1 = false;
            });


        },
        formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },
        clipTranslate(start, end, videoFile) {
            return new Promise((resolve, reject) => {
                const ffmpeg = createFFmpeg({
                    log: false,
                    corePath: '/plugin/ffmpeg-core.js',
                    wasmPath: '/plugin/ffmpeg-core.wasm',
                    workerPath: '/plugin/ffmpeg-core.worker.js'
                });

                ffmpeg.load().then(() => {
                    console.log("FFmpeg 加载成功");
                    fetchFile(videoFile).then(async file => {
                        ffmpeg.FS('writeFile', 'input.mp4', file);

                        try {
                            // 将秒转换为时间格式
                            const startTime = this.formatTime(start);
                            const endTime = this.formatTime(end);

                            // 执行裁剪命令
                            const ffmpegCommand = [
                                '-i', 'input.mp4',
                                '-ss', startTime,
                                '-to', endTime,
                                '-c:v', 'copy',
                                '-c:a', 'copy',
                                'output.mp4'
                            ];
                            await ffmpeg.run(...ffmpegCommand);
                            //await ffmpeg.run('-i', 'input.mp4', '-ss', start, '-to', end, '-c', 'copy', 'output.mp4');
                            console.log("裁剪完成");

                            //检查文件系统中的文件
                            const files = ffmpeg.FS('readdir', '/');
                            console.log("当前文件系统中的文件:", files);

                            // 确保裁剪后的文件存在
                            if (!files.includes('output.mp4')) {
                                throw new Error("裁剪后的文件未生成");
                            }

                            // 读取裁剪后的视频文件
                            const data = ffmpeg.FS('readFile', 'output.mp4');
                            resolve(data);
                        } catch (error) {
                            console.error("FFmpeg 命令执行失败或文件读取失败:", error);
                            reject(error);
                        }
                    }).catch(error => {
                        console.error("文件读取失败:", error);
                        reject(error);
                    });
                }).catch(error => {
                    console.error("FFmpeg 初始化失败:", error);
                    reject(error);
                });
            });
        },
        //提取音频方法
        async extractAudio() {
            try {
                // 设置处理状态
                this.processing = true;
                this.processingStatus = '正在提取音频...';

                // 确保FFmpeg已加载
                await this.loadFFmpeg();

                // 从处理文件列表中获取视频文件
                const videoFile = this.processedFiles.find(f => f.type === 'video');
                if (!videoFile) throw new Error('未找到视频文件');

                // 将视频文件写入FFmpeg虚拟文件系统
                ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile.blob));

                // 执行FFmpeg命令提取音频
                // -i: 输入文件
                // -vn: 禁用视频输出
                // -acodec libmp3lame: 使用LAME编码器将音频编码为MP3格式
                await ffmpeg.run(
                    '-i', 'input.mp4',
                    '-vn',
                    '-acodec', 'libmp3lame',
                    'audio.mp3'
                );

                // 从FFmpeg文件系统读取提取的音频
                const data = ffmpeg.FS('readFile', 'audio.mp3');
                // 创建Blob对象用于下载
                const blob = new Blob([data.buffer], { type: 'audio/mp3' });

                // 将处理结果添加到文件列表
                this.processedFiles.push({
                    name: 'extracted_audio.mp3', // 文件名
                    type: 'audio', // 文件类型
                    blob: blob, // 文件数据
                    url: this.createDownloadUrl(blob) // 下载链接
                });

            } catch (error) {
                // 错误处理
                console.error('音频提取失败:', error);
            } finally {
                // 重置处理状态
                this.processing = false;
            }
        },
        beforeDestroy() {
            // 组件销毁前移除事件监听
            const videoPlayer = this.$refs.videoPlayer;
            videoPlayer.removeEventListener('timeupdate', this.syncSubtitles);
        },
        mounted() {
            this.initializeVideoPlayer();
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
</style>