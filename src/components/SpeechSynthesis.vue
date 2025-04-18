<template>
    <NavigationBar/>
    <div class="container">
      <el-row>
        <el-col :span="24"><div class="grid-content ep-bg-purple-dark" /></el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="2" :offset="4">
          <el-row>
            <el-button :type="isPrimary(1)" size="large" @click="selectButton(1)">小芳</el-button>
          </el-row>
        </el-col>
        <el-col :span="10" :offset="2">
          <div class="grid-content ep-bg-purple">
            <el-card class="audio-upload-card">
              <div class="audio-upload-container">
                <el-input
                  type="textarea"
                  :rows="10"
                  v-model="synthesis_text"
                  placeholder="请输入待合成的文字"
                >
                </el-input>
                <el-button type="primary" @click="synthesizeVoice" style="margin-top: 20px;">语音合成</el-button>
                <el-button style="margin-left: 15px; margin-top: 20px;" type="success" @click="audiodownload">下载音频文件</el-button>
              </div>
              <audio ref="audioPlayer" controls></audio>
            </el-card>
          </div>
        </el-col>
      </el-row>
      
    </div>
</template>
  
  <script>
  import { audio_synthesis, downloadAudioFile } from '@/api/speech_synthesis'
  
  export default {
    data() {
      return {
        fileList: [],
        audioFile: null,
        audioName: '',
        synthesis_text: '', // 用于存储识别结果
        downloadPath: '111',
        audio_id: "",
        selectedIndex: 1 // 默认选中第一个按钮
      };
    },
    methods: {
      selectButton(index) {
        this.selectedIndex = index; // 更新选中的按钮索引
      },
      isPrimary(index) {
        return this.selectedIndex === index ? 'primary' : 'default'; // 判断当前按钮是否应该为 primary 类型
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
        this.audio_id = response.data.result;
      },
      handleError(error, file, fileList) {
        this.$message.error('音频上传失败');
      },
      audiodownload() {
        if (!this.downloadPath) {
          this.$message.error('没有可下载的音频文件');
          return;
        }
        
        downloadAudioFile(this.audio_id).then((response) => {
            console.log(response)
            // 创建一个可下载的 Blob URL
            const blob = response['data'];
            console.log('hahahah')
            console.log(blob)
            const downloadUrl = URL.createObjectURL(blob);

            // 创建一个下载链接
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = this.audio_id + '.wav'; // 使用提供的文件名

            // 触发下载
            if (typeof link.download === 'undefined') {
              // Fallback for browsers that do not support 'download' attribute
              setTimeout(() => {
                link.click();
              }, 100);
            } else {
              // For modern browsers
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }

            // 重置downloadUrl以避免内存泄漏
            URL.revokeObjectURL(downloadUrl);
            this.$message.success('音频下载成功');
          }).catch(error => {
            this.$message.error('下载音频失败');
            throw error
            
        });
      },
      synthesizeVoice() {
        const text = this.synthesis_text;

        console.log("text:", text)

        audio_synthesis(text).then(response => {

          console.log(response)

          this.audio_id = response['data']['data']['result']

          this.$message.success('音频合成成功');

          // 通过 ref 获取 audio 元素
          const audioPlayer = this.$refs.audioPlayer;
          downloadAudioFile(this.audio_id).then((response) => {
            console.log(response)
            // 创建一个可下载的 Blob URL
            const blob = response['data'];
            const downloadUrl = URL.createObjectURL(blob);

            // 设置 audio 元素的 src 属性为下载 URL
            audioPlayer.src = downloadUrl;

            // 等待音频元数据加载完成
            audioPlayer.onloadedmetadata = () => {
              this.$message.success('音频下载成功');
            };

            // 重置downloadUrl以避免内存泄漏
            audioPlayer.onended = () => {
              URL.revokeObjectURL(downloadUrl);
            };
          }).catch(error => {
            this.$message.error('下载音频失败');
            throw error
        });
        }).catch(error => {
          this.$message.error('语音合成失败');
          console.error('Error synthesizing voice:', error);
        });
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
  /* .container {
    position: relative;
    height: 100vh;
  } */

  .audio-upload-container {
    padding: 20px;
  }
  .button {
    margin-top: 30px;
  }
  .speaker-buttons {
    display: flex;
    flex-direction: column; /* 垂直排列按钮 */
    margin-left: 150px; /* 使按钮组靠右 */
    
  }
  .speaker-button {
    width: 250px; /* 固定宽度 */
    height: 40px; /* 固定高度 */
    line-height: 40px; /* 确保文本垂直居中 */
    text-align: center; /* 文本水平居中 */
    margin-top: 15px; /* 将底部外边距改为顶部外边距 */
  }
  .el-row {
    margin-bottom: 20px;
  }
  .el-row:last-child {
    margin-bottom: 0;
  }
  .el-col {
    border-radius: 4px;
  }
  .grid-content {
    border-radius: 4px;
    min-height: 36px;
  }
</style>