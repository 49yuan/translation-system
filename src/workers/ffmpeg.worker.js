import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'

self.onmessage = (event) => {
    const { start, end, videoFile } = event.data;
    const ffmpeg = createFFmpeg({
        log: true,
        corePath: '/plugin/ffmpeg-core.js',
        wasmPath: '/plugin/ffmpeg-core.wasm',
        workerPath: '/plugin/ffmpeg-core.worker.js'
    });
    ffmpeg.load().then(() => {
        ffmpeg.FS('writeFile', 'input.mp4', videoFile);

        // 构建 FFmpeg 命令
        const ffmpegCommand = `-i input.mp4 -ss ${start} -to ${end} -c copy output.mp4`;

        // 执行 FFmpeg 命令
        ffmpeg.run('-i', 'input.mp4', '-ss', start, '-to', end, '-c', 'copy', 'output.mp4').then(() => {
            // 读取裁剪后的视频文件
            const processedVideo = ffmpeg.FS('readFile', 'output.mp4');
            self.postMessage({ processedVideo });
            ffmpeg.exit();
        }).catch(error => {
            self.postMessage({ error: error.message });
            ffmpeg.exit();
        });
    }).catch(error => {
        self.postMessage({ error: error.message });
    });
};