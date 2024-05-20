# 1 Background
# 1.1 Description
This project code reference learning [WasmVideoPlayer](https://github.com/sonysuqin/WasmVideoPlayer), if you need to learn the developers please check the project source code.
This project code is based on the secondary development of WasmVideoPlayer project, according to the need to reorganize the code structure, on the basis of the project to increase the range of playable video and do compatibility processing.
It will be updated continuously.
# 1.2 Usage Scenarios
### 1.2.1 Reduce cloud storage cost and bandwidth
Based on the high compression ratio of H265, we can reduce the size of the video file, and reduce the traffic and storage cost of the cloud service when playing online.
## 1.2.2 Compatible with more video encapsulation formats, video encoding and YUV rendering formats
Compatible:
Package format: MP4, HLV
Video encoding format: H265, H264
Audio encoding format: AAC
Rendering format: YUV420P, YUVJ420P

Continuously updated:
Encoding format: M3U8, MKV
Encoding format: V8, V9, H266
Rendering format: YUV422P, YUV444P
Network Transfer Protocol: WEBSOCKET, WEBRTC

# 2 Code
github address: [https://github.com/DigitalBoyYu/h265-web-player](https://github.com/DigitalBoyYu/h265-web-player).

# 3 Dependencies
## 3.1 WASM
## 3.2 FFmpeg
## 3.3 WebGL
## 3.4 Web Audio

# 4 Player implementation
## 4.1 Threading model
Here is just a simple implementation of some of the functions of the player, including downloading, unpacking, decoding, rendering, audio and video synchronization, and other basic functions, there are still a lot of details can be optimized in each link. At present, it can support various built-in codecs of FFmpeg, such as H264/H265, etc. By default, it supports MP4/FLV file playback and HTTP-FLV stream playback. Web Worker is used here to put the download and the call to FFmpeg into a separate thread.

There are two main threads:
- Main thread (Player): interface control, playback control, download control, audio/video rendering, audio/video synchronization;
- Decoder Worker: download, decode and decode audio and video data;

## 4.2 Functions and Interfaces
## 4.2.1 Player Functions
- play: start playback;
- pause: pause the playback;
- resume: resume playback;
- stop: stop playback;
- fullscreen: fullscreen playback;
- seek: seek playback is not implemented. (will be updated shortly)
### 4.2.2 Interfaces
- initDecoder: initialize decoder, open file cache;
- uninitDecoder: uninitialize decoder;
- openDecoder: open decoder, get file information;
- closeDecoder: close the decoder;
- startDecoding: start decoding;
- pauseDecoding: pause decoding. 
## 4.3 Buffering control
## 4.4 Audio and video synchronization
## 4.5 Caching
## 4.6 Decoding
## 4.7 Data interaction

# 5 Browser Support
- Chrome (webkit kernels such as 360 and Sogou are also supported);
- Firefox;
- Edge.

# 6 Continuous Improvement
- The CPU usage of decoding and playing H265 is relatively high, and will be continuously optimized.
- The decoded data of some audio/video files is not standardized, which may cause audio/video playback to be out of sync, lagging, etc. If you have similar problems, please contact me and provide the video files, I will do self-testing and improvement.

# 7 执行代码
run node server：
```
node server.js
```
WEB URL http://localhost:3000/index.html

index.html
Init：
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