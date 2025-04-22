<template>
  <NavigationBar />

  <div class="main-area">
    <!-- 音色选择区 -->
    <aside class="speaker-panel">
      <div class="speaker-grid">
        <!-- 女声 -->
        <div class="gender-col">
          <div class="speaker-title">女声</div>
          <div v-for="sp in femaleSpeakers" :key="sp.id" class="speaker-row" @click="selectButton(sp.id)">
            <el-button :type="isPrimary(sp.id)" size="large" class="speaker-button">{{ sp.name }}</el-button>
          </div>
        </div>
        <!-- 男声 -->
        <div class="gender-col">
          <div class="speaker-title">男声</div>
          <div v-for="sp in maleSpeakers" :key="sp.id" class="speaker-row" @click="selectButton(sp.id)">
            <el-button :type="isPrimary(sp.id)" size="large" class="speaker-button">{{ sp.name }}</el-button>
          </div>
        </div>
      </div>

      <!-- 参数调节 -->
      <div class="slider-box">
        <div class="slider-row">
          <span>音量</span>
          <el-slider v-model="vol" :min="-10" :max="10" :step="0.5" show-input />
        </div>
        <div class="slider-row">
          <span>语速</span>
          <el-slider v-model="speed" :min="0.5" :max="3" :step="0.1" show-input />
        </div>
        <div class="slider-row">
          <span>音高</span>
          <el-slider v-model="pitch" :min="-6" :max="6" :step="0.5" show-input />
        </div>
      </div>
    </aside>

    <!-- 合成区 -->
    <section class="synthesis-panel">
      <el-card>
        <div class="audio-upload-container">
          <el-input
            type="textarea"
            :rows="10"
            v-model="synthesis_text"
            placeholder="请输入待合成的文字"
          />
          <el-button type="primary" style="margin-top:20px" @click="synthesizeVoice">语音合成</el-button>
          <el-button type="success" style="margin-top:20px;margin-left:15px" @click="audiodownload">下载音频文件</el-button>
        </div>
        <audio ref="audioPlayer" controls />
      </el-card>
    </section>
  </div>
</template>

<script>
import { audio_synthesis, downloadAudioFile } from '@/api/speech_synthesis'

export default {
  data () {
    return {
      synthesis_text: '',
      selectedIndex: 1,
      audio_id: '',
      vol: 0.0,
      speed: 1.0,
      pitch: 0.0,
      speakers: [
        { id: 1,  name: '赖', gender: 'male'   },
        { id: 2,  name: '阿强', gender: 'male'   },
        { id: 3,  name: '小华', gender: 'male'   },
        { id: 4,  name: '小杰', gender: 'male'   },
        { id: 5,  name: '小刚', gender: 'male'   },
        { id: 6,  name: '小芳', gender: 'female' },
        { id: 7,  name: '小丽', gender: 'female' },
        { id: 8,  name: '小红', gender: 'female' },
        { id: 9,  name: '小琴', gender: 'female' },
        { id: 10, name: '小梅', gender: 'female' }
      ]
    }
  },
  computed: {
    maleSpeakers ()   { return this.speakers.filter(s => s.gender === 'male') },
    femaleSpeakers () { return this.speakers.filter(s => s.gender === 'female') }
  },
  methods: {
    selectButton (id) { this.selectedIndex = id },
    isPrimary   (id) { return this.selectedIndex === id ? 'primary' : 'default' },

    async audiodownload () {
      if (!this.audio_id) return this.$message.warning('暂无可下载文件')
      try {
        const res = await downloadAudioFile(this.audio_id)
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = this.audio_id + '.wav'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.$message.success('下载成功')
      } catch {
        this.$message.error('下载失败')
      }
    },

    async synthesizeVoice () {
      const text = this.synthesis_text.trim()
      if (!text) return this.$message.warning('请输入文本')

      try {
        const { data } = await audio_synthesis(
          text,
          parseInt(this.selectedIndex),
          parseFloat(this.vol),
          parseFloat(this.speed),
          parseFloat(this.pitch)
        )
        this.audio_id = data.data.result
        this.$message.success('合成成功')

        const res = await downloadAudioFile(this.audio_id)
        const url = URL.createObjectURL(res.data)
        const p = this.$refs.audioPlayer
        p.src = url
        p.onended = () => URL.revokeObjectURL(url)
      } catch (err) {
        console.error('合成失败 detail:', err.response?.data)
        this.$message.error('语音合成失败')
      }
    }
  }
}
</script>

<style scoped>
.main-area {
  display: flex;
  align-items: flex-start;
}
.speaker-panel {
  width: 360px;
  margin-left: 80px;
  margin-right: 40px;
}
.speaker-grid {
  display: flex;
  gap: 20px;
}
.gender-col {
  flex: 1;
}
.speaker-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
}
.speaker-row {
  margin-bottom: 12px;
}
.speaker-button {
  width: 100%;
}

/* 滑动条控制区 */
.slider-box {
  margin-top: 40px;
}
.slider-row {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.slider-row span {
  width: 40px;
  text-align: right;
  font-weight: 500;
}

/* 合成区样式 */
.synthesis-panel {
  flex: 1;
  max-width: 900px;
  margin-left: 40px;
}
.audio-upload-container {
  padding: 20px;
}
</style>
