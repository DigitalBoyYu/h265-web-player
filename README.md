# 1 背景
# 1.1 描述
本项目代码参考学习[WasmVideoPlayer](https://github.com/sonysuqin/WasmVideoPlayer),如需学习的小伙伴请查看该项目源码。
本项目代码基于WasmVideoPlayer项目的二次开发，根据需要重新梳理了代码架构，在项目基础上增加了可播放的视频的范围以及做了兼容性处理。
后续还会持续更新.
# 1.2 使用场景
### 1.2.1 降低云存储成本与带宽
基于H265的高压缩比例，降低视频文件大小，减少在线播放时的流量与云端服务的存储成本。
### 1.2.2 兼容更多视频封装格式、视频编码与YUV渲染格式
已兼容：
封装格式：MP4、FLV
视频编码格式：H265、H264
音频编码格式：AAC
渲染格式：YUV420P、YUVJ420P

持续更新：
封装格式：M3U8、MKV
编码格式：V8、V9、H266
渲染格式：YUV422P、YUV444P
网络传输协议：WEBSOCKET、WEBRTC

# 2 代码
github地址: []().

# 3 依赖
## 3.1 WASM
## 3.2 FFmpeg
## 3.3 WebGL
## 3.4 Web Audio

# 4 播放器实现
## 4.1 线程模型
这里只是简单实现了播放器的部分功能，包括下载、解封装、解码、渲染、音视频同步等基本功能，每个环节还有很多细节可以优化。目前可以支持FFmpeg的各种内置codec，如H264/H265等，默认支持MP4/FLV文件播放、HTTP-FLV流的播放。这里使用了Web Worker，把下载和对FFmpeg的调用放到单独的线程中去。

主要有二个线程：
- 主线程(Player)：界面控制、播放控制、下载控制、音视频渲染、音视频同步；
- 解码线程(Decoder Worker)：音视频数据的下载、解封装、解码；

## 4.2 功能与接口
### 4.2.1 播放器功能
- play：开始播放；
- pause：暂停播放； 调试中（短期内会更新）
- resume：恢复播放；暂未实现。（短期内会更新）
- stop：停止播放；
- fullscreen：全屏播放； 
- seek：seek播放未实现。（短期内会更新）
### 4.2.2 接口
- initDecoder：初始化解码器，开辟文件缓存；
- uninitDecoder：反初始化解码器；
- openDecoder：打开解码器，获取文件信息；
- closeDecoder：关闭解码器；
- startDecoding：开始解码；
- pauseDecoding：暂停解码。 
## 4.3 缓冲控制
## 4.4 音视频同步
## 4.5 缓存
## 4.6 解码
## 4.7 数据交互

# 5 浏览器支持
- Chrome(360浏览器、搜狗浏览器等webkit内核也支持)；
- Firefox；
- Edge。

# 6 持续改进
- 解码、播放H265的CPU占用相对来说较高，后续会进行持续优化。
- 部分音视频文件的解码后的数据是不规范，可能导致音视频播放出现音视频不同步，卡顿等，如有类似问题，请联系我并提供视频文件，我进行自测与改进。

# 7 执行代码
执行命令，启动本地服务：
```
node server.js
```
WEB URL http://localhost:3000/index.html

初始化：
```
let canvas = document.getElementById('playCanvas')
let player = new Player()
player.init({
    width: 500,
    height: 500,
    canvas: canvas,
    url: 'http://localhost:3000/video/h265.mp4'
})
```



