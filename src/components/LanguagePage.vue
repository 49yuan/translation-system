<template>
    <div class="language-page">
        <el-card class="upload-area">
            <el-upload ref="upload" action="#" :on-preview="handlePreview" :on-remove="handleRemove"
                :on-success="handleSuccess" :on-change="handleChange" :file-list="fileState.fileList" multiple
                :auto-upload="false" accept=".mp3,.wav" list-type="text">
                <el-button type="primary" class="f-button">
                    <el-icon>
                        <FolderOpened />
                    </el-icon>上传音频文件
                </el-button>
            </el-upload>
            <div class="b-isminnan">
                <el-button type="primary" class="f-button" @click="isminnan" :loading="loadingState.isMinnanIdentifying"
                    :disabled="loadingState.isMinnanIdentifying">
                    <el-icon v-if="!loadingState.isMinnanIdentifying">
                        <Memo />
                    </el-icon>
                    {{ loadingState.isMinnanIdentifying ? '识别中...' : '闽南语识别' }}
                </el-button>
            </div>
        </el-card>
        <el-card class="result-area">
            <div v-if="resultState.displaySection === 'results'">
                <h3>识别结果</h3>
                <el-table :data="resultState.results" style="width: 100%">
                    <el-table-column prop="fileName" label="文件名"></el-table-column>
                    <el-table-column label="识别语种">
                        <template v-slot:default="scope">
                            <span v-for="(value, key) in scope.row.languages" :key="key">
                                {{ key }}: {{ value.toFixed(2) }}&nbsp;&nbsp;&nbsp;
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div v-if="resultState.displaySection === 'minnanResults'">
                <h3>以下为闽南语素材：</h3>
                <el-table :data="resultState.minnanResults" style="width: 100%">
                    <el-table-column prop="fileName" label="文件名"></el-table-column>
                </el-table>
                <h3>以下非闽南语素材：</h3>
                <el-table :data="resultState.innanResults" style="width: 100%">
                    <el-table-column prop="fileName" label="文件名"></el-table-column>
                </el-table>
            </div>
            <div v-if="resultState.displaySection === 'none'">
                <p>暂无识别结果</p>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLanguageStore } from '@/stores/language'
import { storeToRefs } from 'pinia'
import axios from '@/api/axios'
import { ElMessage } from 'element-plus';

const languageStore = useLanguageStore()
const {
    fileState,
    resultState,
    loadingState
} = storeToRefs(languageStore)

const upload = ref(null)

// 文件处理方法
const handlePreview = (file) => {
    console.log("Preview file:", file)
}

const handleRemove = (file) => {
    console.log("Remove file:", file)
    const index = fileState.value.fileList.indexOf(file)
    if (index !== -1) {
        const updatedFiles = [...fileState.value.fileList]
        updatedFiles.splice(index, 1)
        languageStore.updateFileList(updatedFiles)
    }
}

const handleSuccess = (response, file) => {
    console.log("File upload success:", response, file)
}

const handleChange = (file, files) => {
    languageStore.updateFileList(files)
}

// 闽南语识别方法
const isminnan = async () => {
    if (fileState.value.fileList.length === 0) {
        ElMessage.error("请先上传文件！")
        return
    }

    languageStore.loadingState.isMinnanIdentifying = true

    const formData = new FormData()
    fileState.value.fileList.forEach(file => {
        formData.append('file_array', file.raw)
    })

    try {
        const response = await axios.post('/web/lid/exist_minnan', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response.data.code === 200) {
            const minnanResults = Object.entries(response.data.data.result)
                .filter(([fileName, isMinnan]) => isMinnan)
                .map(([fileName]) => ({ fileName }))

            const innanResults = Object.entries(response.data.data.result)
                .filter(([fileName, isMinnan]) => !isMinnan)
                .map(([fileName]) => ({ fileName }))

            languageStore.updateMinnanResults(minnanResults, innanResults)
            languageStore.updateFileList([])
        } else {
            ElMessage.error(response.data.msg || "闽南语识别失败！")
        }
    } catch (error) {
        console.error("Error:", error)
        ElMessage.error("闽南语识别失败！")
    } finally {
        languageStore.loadingState.isMinnanIdentifying = false
    }
}
</script>

<style scoped>
.language-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
}

.upload-area {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.b-isminnan {
    display: flex;
    justify-content: flex-end;
}

.result-area {
    min-height: 300px;
}
</style>
<style scoped>
.language-page {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.upload-area {
    width: 80%;
    margin-bottom: 20px;
    position: relative;
}

.result-area {
    width: 80%;
}

.b-isminnan {
    position: absolute;
    top: 20px;
    left: 165px;
}
</style>