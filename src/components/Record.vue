<template>
    <div class="translation-record-page">
        <!-- 搜索框 -->
        <div class="search-box">
            <a class="search-btn" @click="toggleSearchBox">
                <img src="@/assets/search.png" alt="Search Icon">
            </a>
            <input class="search-txt" v-model="searchQuery" placeholder="请输入搜索关键词" @input="debouncedSearch"
                @keyup.enter="searchRecords" />
            <el-select v-model="searchType" placeholder="选择素材类型" style="margin-left: 10px;">
                <el-option label="全部" value="all"></el-option>
                <el-option label="文本" value="text"></el-option>
                <el-option label="图片" value="image"></el-option>
                <el-option label="视频" value="video"></el-option>
            </el-select>
        </div>

        <el-card class="translation-record-card">
            <div class="header">
                <h3>翻译记录</h3>
                <div class="filter-area">
                    <el-date-picker v-model="filterDate" type="date" placeholder="选择日期"
                        @change="filterRecords"></el-date-picker>
                    <el-input v-model="filterFileName" placeholder="输入文件名" @input="filterRecords"></el-input>
                </div>
            </div>
            <el-table :data="filteredRecords" style="width: 100%" empty-text="暂无翻译记录">
                <el-table-column prop="timestamp" label="翻译时间" width="180"></el-table-column>
                <el-table-column prop="fileName" label="文件名" width="200"></el-table-column>
                <el-table-column prop="translationDirection" label="翻译方向" width="150"></el-table-column>
                <el-table-column prop="fileSize" label="文件大小" width="100"></el-table-column>
                <el-table-column label="文件类型" width="80">
                    <template v-slot:default="scope">
                        <el-tag
                            :type="scope.row.fileType === 'text' ? 'info' : scope.row.fileType === 'image' ? 'success' : 'warning'">
                            {{ scope.row.fileType }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="缩略图" width="150">
                    <template v-slot:default="scope">
                        <img v-if="scope.row.thumbnailUrl" :src="scope.row.thumbnailUrl" alt="Thumbnail"
                            class="thumbnail" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="360">
                    <template v-slot:default="scope">
                        <el-button type="success" @click="viewDetails(scope.row)">查看详情</el-button>
                        <el-button type="success" @click="exportRecord(scope.row)">导出</el-button>
                        <el-button type="danger" @click="deleteRecord(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script>
import _ from "lodash"; // 引入 lodash 用于防抖操作

export default {
    name: "TranslationRecord",
    data() {
        return {
            filterDate: null,
            filterFileName: "",
            searchQuery: "",
            searchType: "all", // 默认搜索全部类型
            translationRecords: [
                {
                    timestamp: "2025-03-01 10:00:00",
                    fileName: "example1.wav",
                    translationDirection: "中文 -> 缅甸语",
                    fileSize: "1.2MB",
                    fileType: "text",
                    thumbnailUrl: null,
                },
                {
                    timestamp: "2025-03-02 12:30:00",
                    fileName: "example2.jpg",
                    translationDirection: "缅甸语 -> 中文",
                    fileSize: "2.5MB",
                    fileType: "image",
                    thumbnailUrl: require('@/assets/OIP.jpg'),
                },
                {
                    timestamp: "2025-03-03 15:45:00",
                    fileName: "example3.mp4",
                    translationDirection: "缅甸语 -> 中文",
                    fileSize: "12.8MB",
                    fileType: "video",
                    thumbnailUrl: require('@/assets/OIP2.jpg'),
                },
                {
                    timestamp: "2025-03-04 09:15:00",
                    fileName: "example4.txt",
                    translationDirection: "中文 -> 缅甸语",
                    fileSize: "0.5MB",
                    fileType: "text",
                    thumbnailUrl: null,
                },
            ],
        };
    },
    computed: {
        filteredRecords() {
            return this.translationRecords.filter((record) => {
                const dateMatch = !this.filterDate || new Date(record.timestamp).toDateString() === new Date(this.filterDate).toDateString();
                const fileNameMatch = !this.filterFileName || record.fileName.toLowerCase().includes(this.filterFileName.toLowerCase());
                const searchMatch = !this.searchQuery || record.fileName.toLowerCase().includes(this.searchQuery.toLowerCase());
                const typeMatch = this.searchType === "all" || record.fileType === this.searchType;
                return dateMatch && fileNameMatch && searchMatch && typeMatch;
            });
        },
    },
    methods: {
        filterRecords() {
            // 筛选逻辑在 computed 属性中自动处理
        },
        toggleSearchBox() {
            this.searchQuery = ""; // 清空搜索框
        },
        debouncedSearch: _.debounce(function () {
            this.searchRecords();
        }, 300),
        searchRecords() {
            // 搜索逻辑在 computed 属性中自动处理
        },
        viewDetails(record) {
            alert(`查看详情: ${record.fileName}`);
        },
        exportRecord(record) {
            alert(`导出记录: ${record.fileName}`);
        },
        deleteRecord(record) {
            this.$confirm(`确定要删除记录 ${record.fileName} 吗？`, "提示", {
                type: "warning",
            }).then(() => {
                this.translationRecords = this.translationRecords.filter((r) => r.fileName !== record.fileName);
                this.$message.success("记录已删除");
            }).catch(() => {
                this.$message.info("已取消删除");
            });
        },
    },
};
</script>

<style scoped>
.translation-record-page {
    display: flex;
    justify-content: center;
    padding: 20px;
}

.translation-record-card {
    width: 100%;
    max-width: 1200px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.filter-area {
    display: flex;
    gap: 10px;
}

.search-box {
    z-index: 999;
    position: fixed;
    top: 200px;
    right: 50px;
    background-color: white;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    height: 24px;
    padding: 9px;
    border-radius: 40px;
    display: flex;
    align-items: center;
    transition: all 0.4s;
}

.search-txt {
    border: none;
    background: none;
    outline: none;
    padding: 0;
    color: #222;
    font-size: 16px;
    line-height: 20px;
    width: 0;
    transition: 0.4s;
}

.search-btn {
    color: #888888;
    font-size: 24px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: 0.4s;
}

.search-btn img {
    width: 24px;
    height: 24px;
}

.search-box:hover .search-txt {
    width: 200px;
    padding: 0 12px;
}

.search-txt:focus {
    width: 200px;
    padding: 0 12px;
}

.thumbnail {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
}
</style>