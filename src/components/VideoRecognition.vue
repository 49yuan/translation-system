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
            <el-slider v-model="videoTimestamp" :min="0" :max="videoDuration" range show-stops :marks="marks" @change="handleTimestampChange" class="video-slider"></el-slider>
            <div class="right-end">
              <el-select v-model="language" placeholder="语言" style="width: 100px; margin-right: 10px;">
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
              </el-select>
              <el-upload :before-upload="beforeVideoUpload" :on-change="handleVideoChange" :auto-upload="false" :show-file-list="false" class="button">
                <el-button type="primary" class="f-button">
                  <el-icon><FolderOpened /></el-icon>上传视频文件
                </el-button>
              </el-upload>
              <el-button type="primary" class="f-button" @click="fetchSubtitles" :loading="isTranslating2" :disabled="isTranslating2">
                <el-icon v-if="!isTranslating2"><Connection /></el-icon>
                {{ isTranslating2 ? '翻译中...' : '整体翻译' }}
              </el-button>
              <el-button style="margin-left: 10px;" type="primary" class="f-button" @click="selectSegment" :loading="isTranslating1" :disabled="isTranslating1">
                <el-icon v-if="!isTranslating1"><Scissor /></el-icon>
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
      return { translationStore, videoTranslation }
    },
    data() {
      return {
        isTranslating2: false,
        isTranslating1: false,
        ffmpeg: null,
        language: 'zh'
      }
    },
    computed: {
      videoFile: { get() { return this.videoTranslation.videoFile }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, videoFile: value }) } },
      videoName: { get() { return this.videoTranslation.videoName }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, videoName: value }) } },
      videoSrc: { get() { return this.videoTranslation.videoSrc }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, videoSrc: value }) } },
      videoFileList: { get() { return this.videoTranslation.videoFileList }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, videoFileList: value }) } },
      videoDuration: { get() { return this.videoTranslation.videoDuration }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, videoDuration: value }) } },
      videoTimestamp: { get() { return this.videoTranslation.videoTimestamp }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, videoTimestamp: value }) } },
      marks: { get() { return this.videoTranslation.marks }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, marks: value }) } },
      recognitionResult: { get() { return this.videoTranslation.recognitionResult || '' }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, recognitionResult: value }) } },
      subtitles: { get() { return this.videoTranslation.subtitles }, set(value) { this.translationStore.saveVideoTranslationState({ ...this.videoTranslation, subtitles: value }) } }
    },
    methods: {
        async fetchSubtitles() {
            if (!this.videoFile || !this.videoFile.name) {
                this.$message.error('请先上传视频文件');
                return;
            }

            const [start, end] = this.videoTimestamp;
            this.isTranslating2 = true;

            try {
                console.log('[DEBUG] 当前语言:', this.language);
                console.log('[DEBUG] 请求起止时间:', start, end);
                console.log('[DEBUG] 当前视频文件:', this.videoFile.name);

                const wav = await this.extractAudio(start, end, this.videoFile);
                const blob = new Blob([wav.data], { type: 'audio/wav' });

                const formData = new FormData();
                formData.append('file', blob, wav.name);

                console.log('[DEBUG] 提交的音频文件名:', wav.name);
                console.log('[DEBUG] formData.get("file"):', formData.get('file'));

                const token = localStorage.getItem('token');
                console.log('[DEBUG] Authorization Token:', token);

                const response = await axios.post(
                `/speaker_diarization?language=${this.language}&start_time=${start}&end_time=${end}`,
                formData,
                {
                    headers: {
                    'Content-Type': 'multipart/form-data',
                    }
                }
                );

                console.log('[DEBUG] 接口响应:', response.data);

                if (response.data.code === 200) {
                this.subtitles = response.data.data.recognition_result.map(sub => ({
                    text: sub.text,
                    start_time: sub.start_time,
                    end_time: sub.end_time
                }));
                this.renderHighlightedText();
                } else {
                console.warn('[DEBUG] 响应 code 非 200:', response.data.code);
                this.$message.error('获取翻译结果失败');
                }
            } catch (error) {
                console.error('获取翻译结果失败:', error);
                if (error.response) {
                console.error('[DEBUG] 错误响应数据:', error.response.data);
                }
                this.$message.error('获取翻译结果失败');
            } finally {
                this.isTranslating2 = false;
            }
            },
      async selectSegment() {
        if (!this.videoFile || !this.videoFile.name) {
          this.$message.error('请先上传视频文件'); return;
        }
        const [start, end] = this.videoTimestamp;
        this.isTranslating1 = true;
        try {
          const wav = await this.extractAudio(start, end, this.videoFile);
          const blob = new Blob([wav.data], { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('file', blob, wav.name);
          const response = await axios.post(`/speaker_diarization?language=${this.language}&start_time=${start}&end_time=${end}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (response.data.code === 200) {
            this.subtitles = response.data.data.recognition_result.map(sub => ({ text: sub.text, start_time: sub.start_time, end_time: sub.end_time }));
            this.renderHighlightedText();
          } else this.$message.error('选段翻译失败');
        } catch (error) {
          console.error('选段翻译失败:', error);
          this.$message.error('选段翻译失败');
        } finally { this.isTranslating1 = false; }
      },
      async extractAudio(start, end, prefile) {
        if (!this.ffmpeg) {
          this.ffmpeg = new FFmpeg();
          await this.ffmpeg.load({ coreURL: "/plugin/ffmpeg-core.js", wasmURL: "/plugin/ffmpeg-core.wasm" });
        }
        try { await this.ffmpeg.unlink("input.mp4") } catch (e) {}
        try { await this.ffmpeg.unlink("output.wav") } catch (e) {}
  
        await this.ffmpeg.writeFile("input.mp4", await fetchFile(prefile));
        const originName = prefile?.name || 'temp_video.mp4';
        await this.ffmpeg.exec(['-ss', this.formatTime(start), '-i', 'input.mp4', '-to', this.formatTime(end), '-vn', '-c:a', 'pcm_s16le', 'output.wav']);
        const data = await this.ffmpeg.readFile("output.wav");
        return { data, name: originName.replace(/\.[^.]+$/, '_split.wav') };
      },
      renderHighlightedText() {
        let html = '', dot_num = 0;
        this.subtitles.forEach(subtitle => {
          html += `<span class="text_e" data-start="${subtitle.start_time}" data-end="${subtitle.end_time}">${subtitle.text}</span>`;
          if (subtitle.text.split('。').length - 1 >= 3) dot_num = 3;
          else if (subtitle.text.endsWith('。') || subtitle.text.endsWith('？')) dot_num++;
          if (dot_num >= 3) { html += `<br class="extra-line">`; dot_num = 0; } else dot_num++;
        });
        this.recognitionResult = html;
      },
      syncSubtitles() {
        const currentTime = this.$refs.videoPlayer.currentTime;
        document.querySelectorAll('.text_e').forEach(span => {
          const start = parseFloat(span.getAttribute('data-start'));
          const end = parseFloat(span.getAttribute('data-end'));
          if (currentTime >= start && currentTime <= end) span.classList.add('highlight');
          else span.classList.remove('highlight');
        });
      },
      formatTime(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      },
      formatTime1(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
      },
      handleTimestampChange() {
        const [start] = this.videoTimestamp;
        this.$refs.videoPlayer.currentTime = start;
      },
      handleVideoChange(file, fileList) {
        this.videoFile = file.raw;
        this.videoName = file.name;
        this.videoFileList = [file];
        if (this.videoFile) {
          this.videoSrc = URL.createObjectURL(this.videoFile);
          this.$nextTick(() => {
            const video = this.$refs.videoPlayer;
            video.src = this.videoSrc;
            video.addEventListener('timeupdate', this.syncSubtitles);
            video.addEventListener('loadedmetadata', () => {
              this.videoDuration = video.duration;
              this.videoTimestamp = [0, this.videoDuration];
              this.marks = { 0: '0s', [this.videoDuration]: `${this.formatTime1(this.videoDuration)}` };
            });
          });
          this.recognitionResult = '';
        }
      },
      beforeVideoUpload(file) {
        this.videoFileList = [];
        const isVideo = file.type.startsWith('video/');
        if (!isVideo) this.$message.error('请上传视频文件!');
        return isVideo;
      },
      initializeVideoPlayer() {
        const videoPlayer = this.$refs.videoPlayer;
        if (videoPlayer) {
          videoPlayer.addEventListener('timeupdate', this.syncSubtitles);
        }
      }
    },
    mounted() {
      this.initializeVideoPlayer();
      if (!this.videoTranslation.recognitionResult) this.recognitionResult = '';
      if (this.videoSrc && this.$refs.videoPlayer) {
        this.$refs.videoPlayer.src = this.videoSrc;
        this.$refs.videoPlayer.addEventListener('loadedmetadata', () => {
          if (this.videoDuration > 0) {
            this.marks = { 0: '0s', [this.videoDuration]: `${this.formatTime1(this.videoDuration)}` };
          }
        });
      }
    },
    activated() {
      if (this.videoSrc && this.$refs.videoPlayer) this.$refs.videoPlayer.src = this.videoSrc;
    },
    beforeUnmount() {
      const video = this.$refs.videoPlayer;
      if (video) video.removeEventListener('timeupdate', this.syncSubtitles);
      if (this.ffmpeg) this.ffmpeg.terminate();
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