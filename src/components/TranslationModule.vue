<template>
    <div class="translation-module">
        <el-card class="translation-card">
            <el-tabs v-model="activeTab" @tab-click="handleTabClick">
                <el-tab-pane label="文本翻译" name="text">文本翻译</el-tab-pane>
                <el-tab-pane label="图片翻译" name="image">图片翻译</el-tab-pane>
                <el-tab-pane label="文档翻译" name="document">文档翻译</el-tab-pane>
                <el-tab-pane label="视频翻译" name="video">视频翻译</el-tab-pane>
            </el-tabs>

            <div v-if="activeTab === 'text'">
                <el-input v-model="textToTranslate" type="textarea" placeholder="请输入文本" rows="4"></el-input>
                <el-button type="primary" style="margin-top: 10px; margin-bottom: 10px;"
                    @click="translateText">翻译</el-button>
                <div v-if="translatedText" class="translated-text">
                    <div class="action-right"><span><el-icon>
                                <Edit />
                            </el-icon>编辑&nbsp;&nbsp;&nbsp;</span><span><el-icon><Select /></el-icon>保存</span></div>
                    <h4>翻译结果：</h4>
                    <p>{{ translatedText }}</p>
                </div>
            </div>

            <div v-if="activeTab === 'image'">
                <el-upload class="upload-demo" action="#" :on-change="handleImageUpload" :auto-upload="false"
                    accept="image/*">
                    <el-button type="primary">上传图片</el-button>
                </el-upload>
                <el-button class="right2" type="primary" @click="translateImage">翻译图片</el-button>

                <!-- 图片展示区域 -->
                <div class="image-display-area" v-if="imageFile || translatedImage">
                    <div class="action-right">
                        <span><el-icon>
                                <Download />
                            </el-icon>下载译文</span>
                        <span><el-icon>
                                <CopyDocument />
                            </el-icon>保存图片</span>
                    </div>
                    <div class="image-container">
                        <div class="original-image">
                            <h4>原图</h4>
                            <img :src="imageUrl" alt="Original Image" class="image" />
                        </div>
                        <div class="translated-image">
                            <h4>翻译结果</h4>
                            <img :src="translatedImage" alt="Translated Image" class="image" />
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'document'">
                <el-upload class="upload-demo" action="#" :on-change="handleDocumentUpload" :auto-upload="false"
                    accept=".docx,.pdf">
                    <el-button type="primary">上传文档</el-button>
                </el-upload>
                <el-button type="primary" @click="translateDocument" class="right2">翻译文档</el-button>
                <div v-if="translatedDocumentText" class="translated-text">
                    <el-button color="#626aef" :dark="isDark">下载译文</el-button>
                </div>
            </div>

            <div v-if="activeTab === 'video'">
                <el-upload class="upload-demo" action="#" :on-change="handleVideoUpload" :auto-upload="false"
                    accept="video/*">
                    <el-button type="primary">上传视频</el-button>
                </el-upload>
                <el-button type="primary" @click="translateVideo" class="right2">翻译视频</el-button>
                <div v-if="translatedVideoText" class="translated-text">
                    <el-button color="#626aef" :dark="isDark">导出excel</el-button>

                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
export default {
    data() {
        return {
            activeTab: "text",
            textToTranslate: "",
            translatedText: "",
            imageFile: null, // 用于存储上传的图片文件
            imageUrl: null, // 用于显示上传的图片
            translatedImage: null, // 用于存储翻译后的图片路径
            documentFile: null,
            videoFile: null,
            translatedDocumentText: "",
            translatedVideoText: "",
        };
    },
    methods: {
        handleTabClick(tab) {
            this.activeTab = tab.name;
        },
        translateText() {
            // 调用翻译 API
            this.translatedText = "起初，神创造天地。大地无形，这是自由的月份。黑暗笼罩着深渊，上帝的灵在水面上运行。";
        },
        handleImageUpload(file) {
            this.imageFile = file.raw;
            this.imageUrl = URL.createObjectURL(this.imageFile); // 显示上传的图片
            this.translatedImage = null; // 清空翻译结果
        },
        translateImage() {
            this.translatedImage = require("@/assets/result.jpg");
        },
        handleDocumentUpload(file) {
            this.documentFile = file.raw;
        },
        translateDocument() {
            // 调用文档翻译 API
            this.translatedDocumentText = "翻译结果：文档中的内容。";
        },
        handleVideoUpload(file) {
            this.videoFile = file.raw;
        },
        translateVideo() {
            // 调用视频翻译 API
            this.translatedVideoText = "翻译结果：视频字幕内容。";
        },
    },
};
</script>

<style scoped>
.translation-module {
    display: flex;
    justify-content: center;
    padding: 20px;
}

.translation-card {
    width: 100%;
    max-width: 800px;
}

.translated-text {
    position: relative;
    margin-top: 0;
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 5px;
}

.image-display-area {
    position: relative;
    margin-top: 0px;
    display: flex;
    justify-content: center;
}

.image-container {
    display: flex;
    width: 100%;
    max-width: 800px;
    justify-content: space-between;
}

.image-container>div {
    flex: 1;
    text-align: center;
}

.image-container>div h4 {
    margin-bottom: 10px;
}

.image {
    max-width: 100%;
    height: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.right2 {
    position: relative;
    top: -42px;
    right: -100px;
}

.el-tab-pane {
    height: 0;
}

.action-right {
    position: absolute;
    right: 10px;
}
</style>