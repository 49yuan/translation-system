import axios from "axios";

// 定义一个函数用于上传音频并进行识别
export function audio_synthesis(text) {
    // 发送 GET 请求，包含音频文件
    return axios.get('/synthesis_minnan', {
      params: {'text': text}
    })
}

export function downloadAudioFile(audio_id) {
  // 检查 audioUrl 是否为空
  if (!audio_id) {
    throw new Error('No audio file name provided for download.');
  }

  return axios.get('/synthesis_download_file', {
    params: {'audio_id': audio_id},
    responseType: 'blob'
  });
}