import axios from "axios";

// 登录方法
export async function login(username, password) {
  try {
    const response = await axios.post('/login', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('登录请求失败', error);
    throw error;
  }
}

// 获取用户详细信息
export async function getInfo(token) {
  try {
    const response = await axios.get('getInfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取用户信息请求失败', error);
    throw error;
  }
}

// 退出方法
export async function logout(token) {
  try {
    const response = await axios.post('logout', null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('登出请求失败', error);
    throw error;
  }
}