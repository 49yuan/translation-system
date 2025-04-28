<template>
    <div class="login">
        <h3 class="title">智影动力闽南语翻译演示系统</h3>
        <div class="login_container">
            <div class="login_box">
                <div class="avatar_box">
                    <img :src="logo">
                </div>
                <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0px" class="login-form">
                    <el-form-item prop="username">
                        <el-input v-model="loginForm.username" prefix-icon="user"></el-input>
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="loginForm.password" prefix-icon="lock" type="password"
                            @keyup.enter="handleLogin"></el-input>
                    </el-form-item>
                    <el-form-item style="width:100%;">
                        <el-button :loading="loading" size="large" type="primary" style="width:100%;" class="f-button"
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
            <span>Copyright © 智影动力 All Rights Reserved.</span><br>
            <span>备案号：</span><span><a href="https://beian.miit.gov.cn/" target="_blank">蜀ICP备2021026882号-1号</a></span>
        </div>
    </div>
</template>
  
<script>
import { ElMessage } from 'element-plus'
import { login } from '@/api/login'
import { useTranslationStore } from '@/stores/translation'
import { useRouter } from 'vue-router'

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
                    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入登录密码', trigger: 'blur' },
                    { min: 6, max: 15, message: '长度在 6 到 15 个字符', trigger: 'blur' }
                ]
            },
            loading: false,
            logo: window.g.logo,
        }
    },
    methods: {
        resetLoginForm() {
            this.$refs.loginFormRef?.resetFields()
        },
        async handleLogin() {
            try {
                // 验证表单
                const valid = await this.$refs.loginFormRef.validate()
                if (!valid) {
                    ElMessage.error("请正确填写登录信息")
                    return
                }

                this.loading = true

                // 调用登录API
                const response = await login(this.loginForm.username, this.loginForm.password)

                // 处理响应
                switch (response.code) {
                    case 200:
                        const store = useTranslationStore()
                        const router = useRouter()

                        // 存储认证信息
                        store.setAuth(response.data.result, this.loginForm.username)
                        window.sessionStorage.setItem("token", response.data.result)
                        window.sessionStorage.setItem("username", this.loginForm.username)

                        ElMessage.success("登录成功")
                        this.$router.push('/home')
                        break

                    case 410:
                        ElMessage.error("用户不存在")
                        break

                    case 411:
                        ElMessage.error("密码错误")
                        break

                    default:
                        ElMessage.error(response.data?.msg || "登录失败，未知错误")
                }
            } catch (error) {
                console.error('登录失败:', error)
                ElMessage.error("登录请求异常，请稍后重试")
            } finally {
                this.loading = false
            }
        }
    }
}
</script>
  
<style lang="less" scoped>
.login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 95vh;

    background-color: transparent;
}

.title {
    position: fixed;
    top: 0;
    margin: 20px 0;
    text-align: center;
    color: #353535;
}

.el-login-footer {
    height: 100px;
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