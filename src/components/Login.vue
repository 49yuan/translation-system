<template>
    <div class="login">
        <h3 class="title">智影动力闽南语语音演示系统</h3>
        <div class="login_container">
            <div class="login_box">
                <div class="avatar_box">
                    <img src="../assets/logo.png">
                </div>
                <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0px" class="login-form">
                    <el-form-item prop="username">
                        <el-input v-model="loginForm.username" prefix-icon="el-icon-user"></el-input>
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="loginForm.password" prefix-icon="el-icon-lock" type="password"
                            @keyup.enter="handleLogin"></el-input>
                    </el-form-item>
                    <el-form-item style="width:100%;">
                        <el-button :loading="loading" size="large" type="primary" style="width:100%;"
                            @click.prevent="handleLogin">
                            <span v-if="!loading">登 录</span>
                            <span v-else>登 录 中...</span>
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
        <!--  底部  -->
        <div class="el-login-footer">
            <span>Copyright © 智影动力 All Rights Reserved.</span>
        </div>
    </div>
</template>
  
<script>
import { ElMessage } from 'element-plus';
import { login } from '@/api/login';

export default {
    name: 'LoginPage',
    data() {
        return {
            loginForm: {
                username: 'admin@qq.com',
                password: '123123'
            },
            loginRules: {
                username: [
                    { required: true, message: '请输入登录名称', trigger: 'blur' },
                    { min: 3, max: 20, message: '长度在 3 到 10 个字符', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入登录密码', trigger: 'blur' },
                    { min: 6, max: 15, message: '长度在 6 到 15 个字符', trigger: 'blur' }
                ]
            },
            loading: false
        }
    },
    methods: {
        resetLoginForm() {
            this.$refs.loginFormRef.resetFields();
        },
        async handleLogin() {
            this.$refs.loginFormRef.validate(async (valid) => {
                if (!valid) {
                    ElMessage.error("验证失败");
                    return;
                }
                try {
                    const response = await login(this.loginForm.username, this.loginForm.password);
                    if (response && response.data) {
                        window.sessionStorage.setItem("token", response.data.result);
                        window.sessionStorage.setItem("username", this.loginForm.username);
                        ElMessage.success("登录成功");
                        this.$router.push('/home');
                    } else {
                        ElMessage.error("登录失败");
                    }
                } catch (error) {
                    ElMessage.error("登录请求异常");
                }
            });
        }
    }
};
</script>
  
<style lang="less" scoped>
.login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 95vh;
    background-size: cover;
}

.title {
    position: fixed;
    top: 0;
    margin: 20px 0;
    text-align: center;
    color: #707070;
}

.el-login-footer {
    height: 40px;
    line-height: 40px;
    width: 100%;
    text-align: center;
    color: black;
    font-family: Arial;
    font-size: 12px;
    letter-spacing: 1px;
    position: fixed;
    bottom: 0;
}

.login_container {
    // height: 70%;
    background-color: transparent;
    position: relative;
    margin-bottom: 40px;
}

.login_box {
    width: 450px;
    height: 300px;
    background-color: #fff;
    box-shadow: 0 0 10px #ddd;
    border-radius: 3px;
    position: absolute;
    left: 50%;
    top: 25%;
    transform: translate(-50%, -50%);
}

.avatar_box {
    background-color: #fff;
    height: 130px;
    width: 130px;
    border: 1px solid #eee;
    border-radius: 50%;
    padding: 10px;
    box-shadow: 0 0 10px #ddd;
    position: absolute;
    left: 50%;
    transform: translate(-50%, -50%);
}

.avatar_box img {
    height: 100%;
    width: 100%;
    border-radius: 50%;
    background-color: #eee;
}

.login-form {
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
}
</style>