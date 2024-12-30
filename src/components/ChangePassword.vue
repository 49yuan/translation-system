<template>
    <div class="change-password-container">
        <h3 class="title">修改密码</h3>
        <el-form ref="changePasswordFormRef" :model="changePasswordForm" :rules="changePasswordRules" label-width="100px"
            class="change-password-form">
            <el-form-item label="原密码" prop="oldPassword">
                <el-input v-model="changePasswordForm.old_password" prefix-icon="el-icon-lock" type="password"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="changePasswordForm.new_password" prefix-icon="el-icon-lock" type="password"></el-input>
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmNewPassword">
                <el-input v-model="changePasswordForm.confirmNewPassword" prefix-icon="el-icon-lock"
                    type="password"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleUpdatePassword">修改密码</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import axios from "axios";
export default {
    data() {
        return {
            changePasswordForm: {
                old_password: '',
                new_password: '',
                confirmNewPassword: ''
            },
            changePasswordRules: {
                old_password: [
                    { required: true, message: '请输入原密码', trigger: 'blur' }
                ],
                new_password: [
                    { required: true, message: '请输入新密码', trigger: 'blur' }
                ],
                confirmNewPassword: [
                    { required: true, message: '请确认新密码', trigger: 'blur' },
                    {
                        validator: (rule, value, callback) => {
                            if (value !== this.changePasswordForm.new_password) {
                                callback(new Error('两次输入密码不一致'));
                            } else {
                                callback();
                            }
                        }, trigger: 'blur'
                    }
                ]
            }
        };
    },
    methods: {
        handleUpdatePassword() {
            this.$refs.changePasswordFormRef.validate((valid) => {
                if (valid) {
                    const { old_password, new_password } = this.changePasswordForm;
                    axios.put(`/update_password?${old_password}&${new_password}`)
                        .then(response => {
                            if (response.data.code === 200 && response.data.data.result) {
                                this.$message.success('修改成功');
                                this.$router.push('/login'); // 跳回登录页面
                            } else {
                                this.$message.error(response.data.data.msg || '修改失败');
                            }
                        })
                        .catch(error => {
                            this.$message.error('请求失败');
                        });
                } else {
                    return false;
                }
            });
        }
    }
};
</script>

<style scoped>
.change-password-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-size: cover;
    width: 450px;
    height: 300px;
    background-color: #fff;
    box-shadow: 0 0 10px #ddd;
    border-radius: 3px;
    position: absolute;
    left: 50%;
    top: 44%;
    transform: translate(-50%, -50%);
}
</style>