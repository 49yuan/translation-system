<template>
    <el-menu class="menu" mode="horizontal" :ellipsis="false" background-color="#545c64" text-color="#fff"
        active-text-color="#ffd04b" router>
        <el-menu-item class="logo" style="font-size: 17px;">
            <img src="@/assets/logo.png" alt="Logo" style="height: 70px;" />
            厦门大学智影动力AIGC系统 &nbsp; | &nbsp; <span>语音生成</span>
        </el-menu-item>
        <el-menu-item index="/speech_recognition" style="font-size: 17px;">闽南语翻译</el-menu-item>
        <el-menu-item index="/dialogue" style="font-size: 17px;">闽南语对话翻译</el-menu-item>
        <div class="flex-grow" />
        <el-menu-item style="font-size: 17px;">{{ getUsername() }}</el-menu-item>
        <el-menu-item style="font-size: 17px;"><el-button type="primary" link
                @click="goToChangePassword">修改密码</el-button></el-menu-item>
        <el-menu-item style="font-size: 17px;">
            <el-button type="primary" link @click="logout">退出登录</el-button>
        </el-menu-item>
    </el-menu>
    <el-main>
        <router-view></router-view>
    </el-main>
</template>

<script>
import { ElMessageBox } from 'element-plus';
export default {
    name: 'HomePage',
    methods: {
        goToChangePassword() {
            this.$router.push('/changep');
        },
        logout() {
            ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                window.sessionStorage.clear();
                this.$router.push('/login');
            }).catch(() => {
                // 取消操作
            });
        },
        getUsername() {
            return window.sessionStorage.getItem("username");
        }
    }
}
</script>
<style>
.logo {
    color: white;
    font-weight: bold;
}

.menu {
    line-height: 60px;
    height: 60px;
}

.flex-grow {
    flex-grow: 1;
}
</style>
  