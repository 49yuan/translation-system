<template>
    <el-menu class="menu" mode="horizontal" :ellipsis="false" background-color="#151a3a" text-color="#fff"
        active-text-color="#3b82f6" router>
        <el-menu-item class="logo" style="font-size: 17px;">
            <img :src="logo" alt="Logo" style="height: 70px;" />
            {{ name }} &nbsp; | &nbsp; <span>{{ subtitle }}</span>
        </el-menu-item>
        <el-sub-menu index="/speech_recognition" style="font-size: 17px;">
            <template #title>闽南语翻译</template>
            <el-menu-item index="/speech_recognition">音频识别</el-menu-item>
            <el-menu-item index="/speech_recognition/video">视频识别</el-menu-item>
        </el-sub-menu>
        <!-- <el-menu-item index="/translate" style="font-size: 17px;">缅甸语翻译</el-menu-item> -->
        <el-menu-item index="/dialogue" style="font-size: 17px;">闽南语对话翻译</el-menu-item>
        <el-menu-item index="/language_recognition" style="font-size: 17px;">闽南语语种识别</el-menu-item>
        <!-- <el-menu-item index="/record" style="font-size: 17px;">翻译记录</el-menu-item> -->
        <el-menu-item index="/speech_synthesis" style="font-size: 17px;" disabled>闽南语合成</el-menu-item>
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
    data() {
        return {
            logo: window.g.logo,
            name: window.g.name,
            subtitle: window.g.subtitle,
        };
    },
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
    overflow: hidden;
}

.flex-grow {
    flex-grow: 1;
}

.el-sub-menu__title {
    font-size: 17px !important;
}

.el-menu--horizontal.el-menu {
    border-bottom: none !important;
}
</style>
  