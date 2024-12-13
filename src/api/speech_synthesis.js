import request from '@/utils/request'

// 定义一个函数用于上传音频并进行识别
export function audio_synthesis(text, speaker) {
  
    // 设置请求的 URL，这里需要替换成实际的音频识别 API 端点
    const url = 'http://api.synt.teio.xyz:80/api/web/synthesis_en_to_hk'
    console.log(speaker)
    // 发送 POST 请求，包含音频文件
    return request.get(url, { params: { text, speaker } }).then(response => {
      console.log("res:",response)
      return response.data.downloadUrl;
    });
}

export function downloadAudioFile(audioName) {
  // 检查 audioUrl 是否为空
  if (!audioName) {
    throw new Error('No audio file name provided for download.');
  }

  const url = 'http://api.synt.teio.xyz:80/api/web/synthesis_download_file'

  // 发送 GET 请求以获取音频文件的 Blob，将文件名作为查询参数
  return request.get(url, {
    responseType: 'blob',
    params: { download_path: audioName }, // 假设后端需要filename参数来定位文件
  }).catch(error => {
    throw error; // 可以处理错误或者向外抛出
  });
}