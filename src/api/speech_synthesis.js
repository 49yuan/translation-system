import axios from '@/api/axios';

// 定义一个函数用于上传音频并进行识别
export function audio_synthesis(text,voice_id, vol = 0, speed = 1.0, pitch = 0) {
    // 发送 GET 请求，包含音频文件
    return axios.post('/web/synthesis_minnan', {
        'text': text,
        'voice_id':voice_id,
        'vol':vol,
        'speed':speed,
        'pitch':pitch
    })
}

export function downloadAudioFile(audio_id) {
  // 检查 audioUrl 是否为空
  if (!audio_id) {
    throw new Error('No audio file name provided for download.');
  }

  return axios.get('/web/synthesis_download_file', {
    params: {'audio_id': audio_id},
    responseType: 'blob'
  });
}