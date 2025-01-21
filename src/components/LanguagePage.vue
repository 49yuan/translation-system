<template>
    <div class="language-page">
        <el-card class="upload-area">
            <el-upload ref="upload" action="#" :on-preview="handlePreview" :on-remove="handleRemove"
                :on-success="handleSuccess" :on-change="handleChange" :file-list="fileList" multiple :auto-upload="false"
                accept=".mp3,.wav" list-type="text">
                <el-button type="primary">上传音频文件</el-button>
            </el-upload>
            <el-button type="success" @click="uploadFiles" :loading="Identifying" :disabled="Identifying">{{ Identifying ?
                '识别中...' : '语种识别' }}</el-button>
            <el-button type="success" @click="isminnan" :loading="Identifying1" :disabled="Identifying1">{{ Identifying1 ?
                '识别中...' : '闽南语识别' }}</el-button>
        </el-card>
        <el-card class="result-area">
            <div v-if="displaySection === 'results'">
                <h3>识别结果</h3>
                <el-table :data="results" style="width: 100%">
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
            <div v-if="displaySection === 'minnanResults'">
                <h3>以下为闽南语素材：</h3>
                <el-table :data="minnanResults" style="width: 100%">
                    <el-table-column prop="fileName" label="文件名"></el-table-column>
                </el-table>
                <h3>以下非闽南语素材：</h3>
                <el-table :data="innanResults" style="width: 100%">
                    <el-table-column prop="fileName" label="文件名"></el-table-column>
                </el-table>
            </div>
            <div v-if="displaySection === 'none'">
                <p>暂无识别结果</p>
            </div>
        </el-card>
    </div>
</template>

<script>
import axios from 'axios';
export default {
    data() {
        return {
            fileList: [],
            results: [],
            minnanResults: [],
            innanResults: [],
            Identifying: false,
            Identifying1: false,
        };
    },
    computed: {
        displaySection() {
            if (this.results.length > 0 && this.minnanResults.length == 0) {
                return 'results';
            } else if (this.minnanResults.length > 0) {
                return 'minnanResults';
            } else {
                return 'none';
            }
        }
    },
    methods: {
        handlePreview(file) {
            console.log("Preview file:", file);
        },
        handleRemove(file) {
            console.log("Remove file:", file);
            const index = this.fileList.indexOf(file);
            if (index !== -1) {
                this.fileList.splice(index, 1);
            }
        },
        handleSuccess(response, file) {
            console.log("File upload success:", response, file);
        },
        handleChange(file, fileList) {
            this.fileList = fileList; // 更新文件列表
        },
        async uploadFiles() {
            if (this.fileList.length === 0) {
                this.$message.error("请先上传文件！");
                return;
            }
            this.Identifying = true;
            const formData = new FormData();
            this.fileList.forEach(file => {
                formData.append('file_array', file.raw);
            });

            try {
                const response = await axios.post('/lid/file_language_identify', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.code === 200) {
                    this.results = response.data.data.result.map((item) => {
                        const fileName = Object.keys(item)[0];
                        const languages = item[fileName];
                        const maxConfidence = Math.max(...Object.values(languages));
                        return {
                            fileName,
                            languages,
                            maxConfidence
                        };
                    });
                    this.minnanResults = [];
                    this.fileList = [];
                } else {
                    this.$message.error(response.data.msg || "语种识别失败！");
                }
            } catch (error) {
                console.error("Error:", error);
                this.$message.error("语种识别失败！");
            } finally {
                this.Identifying = false;
            }
        },
        async isminnan() {
            if (this.fileList.length === 0) {
                this.$message.error("请先上传文件！");
                return;
            }
            this.Identifying1 = true;
            const formData = new FormData();
            this.fileList.forEach(file => {
                formData.append('file_array', file.raw);
            });

            try {
                const response = await axios.post('/lid/exist_minnan', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.code === 200) {
                    this.minnanResults = Object.entries(response.data.data.result)
                        .filter(([fileName, isMinnan]) => isMinnan)
                        .map(([fileName]) => ({
                            fileName
                        }));
                    this.innanResults = Object.entries(response.data.data.result)
                        .filter(([fileName, isMinnan]) => !isMinnan)
                        .map(([fileName]) => ({
                            fileName
                        }));
                    this.results = [];
                    this.fileList = [];
                } else {
                    this.$message.error(response.data.msg || "闽南语识别失败！");
                }
            } catch (error) {
                console.error("Error:", error);
                this.$message.error("闽南语识别失败！");
            } finally {
                this.Identifying1 = false;
            }
        },
        // uploadFiles() {
        //     // 模拟后端返回结果
        //     const mockResponse = {
        //         "code": 200,
        //         "router": "/api/web/lid/file_language_identify",
        //         "data": {
        //             "result": [
        //                 {
        //                     "3_single.wav": {
        //                         "nan": 17.527929306030273,
        //                         "cmn": 6.019796371459961,
        //                         "yue": 6.0131731033325195,
        //                         "kor": 5.205012321472168,
        //                         "jpn": 3.317685842514038
        //                     }
        //                 },
        //                 {
        //                     "1_single.wav": {
        //                         "nan": 17.48309326171875,
        //                         "yue": 6.258231163024902,
        //                         "cmn": 5.7073493003845215,
        //                         "kor": 5.599075794219971,
        //                         "jpn": 4.596789836883545
        //                     }
        //                 }
        //             ],
        //             "msg": "成功"
        //         }
        //     };

        //     this.results = mockResponse.data.result.map((item) => {
        //         const fileName = Object.keys(item)[0];
        //         const languages = item[fileName];
        //         const maxConfidence = Math.max(...Object.values(languages));
        //         return {
        //             fileName,
        //             languages,
        //             maxConfidence
        //         };
        //     });
        //     this.minnanResults = [];
        //     this.fileList = [];
        // },
        // isminnan() {
        //     const mockResponse = {
        //         "code": 200,
        //         "router": "/api/web/lid/exist_minnan",
        //         "data": {
        //             "result": {
        //                 "1_single.wav": true,
        //                 "en.wav": false
        //             },
        //             "msg": "成功"
        //         }
        //     };
        //     // 过滤出 result 中值为 true 的文件名
        //     this.minnanResults = Object.entries(mockResponse.data.result)
        //         .filter(([fileName, isMinnan]) => isMinnan)
        //         .map(([fileName]) => ({
        //             fileName
        //         }));
        //     this.results = [];
        //     this.fileList = [];
        // }
    },
};
</script>
<style scoped>
.language-page {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.upload-area {
    width: 80%;
    margin-bottom: 20px;
}

.result-area {
    width: 80%;
}
</style>