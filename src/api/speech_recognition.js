import axios from "axios";

export function audio_recognition_hkTozh(audioFile) {
  if (!(audioFile instanceof File)) {
    throw new Error('audioFile must be a File object');
  }
  const formData = new FormData();
  formData.append('file', audioFile);
  return axios.post('translation_hk_to_zh', formData, {
    headers: {
    }
  });
}

// 定义一个函数用于上传音频并进行识别（闽南语转英文）
export function audio_recognition_hkToen(audioFile) {
  if (!(audioFile instanceof File)) {
    throw new Error('audioFile must be a File object');
  }
  const formData = new FormData();
  formData.append('file', audioFile);
  return axios.post('translation_hk_to_en', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}