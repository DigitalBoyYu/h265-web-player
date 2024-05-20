importScripts("decoder.js");

function Worker() {
    this.accurateSeek = true;
    this.wasmLoaded = false;
    this.cacheBuffer = null;
    this.decodeTimer = null;
    this.videoCallback = null;
    this.audioCallback = null;
    this.requestCallback = null;
}
self.worker = new Worker();

Worker.prototype.initDecoder = function (url, size) {
    var ret = Module._initDecoder(size);
    console.log("initDecoder return " + ret + ".");
    // 返回0代表成功,设置动态内存
    if (ret == 0) {
        cacheBuffer = Module._malloc(size);
        console.log('*cacheBuffer ', cacheBuffer)
    }

    this.downloadFileByHttp(url)
    this.onWasmLoaded()
}

Worker.prototype.downloadFileByHttp = function (url) {
    console.log("Downloading file " + url);

    var xhr = new XMLHttpRequest;
    xhr.open('get', url, true);
    xhr.responseType = 'arraybuffer';
    // xhr.setRequestHeader("Range", "bytes=" + start + "-" + end);
    // var self = this;

    xhr.onload = function () {
        self.worker.onFileData(xhr.response)
    };
    xhr.send();
}

Worker.prototype.onFileData = function (data) {
    console.log("onFileData", data);
    // 编译器的功能 Decoder.sendData,传递给C数据用的
    var typedArray = new Uint8Array(data);
    Module.HEAPU8.set(typedArray, cacheBuffer);
    Module._sendData(cacheBuffer, typedArray.length)
    this.openDecoder();
};

Worker.prototype.openDecoder = function () {
    var paramCount = 7, paramSize = 4;
    var paramByteBuffer = Module._malloc(paramCount * paramSize);
    var ret = Module._openDecoder(paramByteBuffer, paramCount, this.videoCallback, this.audioCallback, this.requestCallback);
    console.log("openDecoder return " + ret);   

    if (ret == 0) {
        var paramIntBuff = paramByteBuffer >> 2;
        var paramArray = Module.HEAP32.subarray(paramIntBuff, paramIntBuff + paramCount);
        var duration = paramArray[0];
        var videoPixFmt = paramArray[1];
        var videoWidth = paramArray[2];
        var videoHeight = paramArray[3];
        var audioSampleFmt = paramArray[4];
        var audioChannels = paramArray[5];
        var audioSampleRate = paramArray[6];

        var message_data = {
            code: 'onOpenDecoder',
            data: ret,
            video: {
                duration: duration,
                videoPixFmt: videoPixFmt,
                videoWidth: videoWidth,
                videoHeight: videoHeight
            },
            audio: {
                audioSampleFmt: audioSampleFmt,
                audioChannels: audioChannels,
                audioSampleRate: audioSampleRate
            }
        };  

        self.postMessage(message_data)
    } else {
        var message_data = {
            code: 'onOpenDecoder',
            e: ret
        };
        self.postMessage(message_data)
    }
    Module._free(paramByteBuffer);
};
Worker.prototype.startDecoding = function (interval) {
    //this.logger.logInfo("Start decoding.");
    // console.log("startDecoding1")
    if (this.decodeTimer) {
        clearInterval(this.decodeTimer);
    }
    this.decodeTimer = setInterval(this.decode, interval);
    
};
Worker.prototype.decode = function () {
    // console.log('decode')
    var ret = Module._decodeOnePacket();
    if (ret == 7) {
        console.log("Decoder finished.")
        self.worker.pauseDecoding();
        var message_data = {
            code: 'DecodeFinished',
        };
        self.postMessage(message_data);
    }

    while (ret == 9) {
        //self.decoder.logger.logInfo("One old frame");
        ret = Module._decodeOnePacket();
    }
};
Worker.prototype.pauseDecoding = function () {
    console.log("Pause decoding.");
    if (this.decodeTimer) {
        clearInterval(this.decodeTimer);
        this.decodeTimer = null;
    }
};
Worker.prototype.uninitDecoder = function () {
    var ret = Module._uninitDecoder();
    console.log("Uninit ffmpeg decoder return " + ret + ".");
    if (this.cacheBuffer != null) {
        Module._free(this.cacheBuffer);
        this.cacheBuffer = null;
    }
};
Worker.prototype.closeDecoder = function () {
    console.log("closeDecoder.");
    if (this.decodeTimer) {
        clearInterval(this.decodeTimer);
        this.decodeTimer = null;
        console.log("Decode timer stopped.");
    }

    var ret = Module._closeDecoder();
    console.log("Close ffmpeg decoder return " + ret + ".");

    var message_data = {
        t: 'closeDecoder'
    };
    self.postMessage(message_data);
};

Worker.prototype.onWasmLoaded = function () {
    console.log("Wasm loaded.");
    this.wasmLoaded = true;

    this.videoCallback = Module.addFunction(function (buff, size, timestamp) {
        var outArray = Module.HEAPU8.subarray(buff, buff + size);
        var data = new Uint8Array(outArray);
        var message_data = {
            code: 'onVideoFrame',
            timestamp: timestamp,
            data: data
        };
        self.postMessage(message_data);
    }, 'viid');

    this.audioCallback = Module.addFunction(function (buff, size, timestamp) {
        var outArray = Module.HEAPU8.subarray(buff, buff + size);
        var data = new Uint8Array(outArray);
        var message_data = {
            code: 'onAudioFrame',
            timestamp: timestamp,
            data: data
        };
        self.postMessage(message_data);
    }, 'viid');

};

self.onmessage = function (evt) {
    // console.log('Worker onmessage')
    if (!self.worker) {
        console.log("Worker not initialized!");
        return;
    }

    let msg_data = evt.data
    console.log('Worker evt', evt.data)
    switch (msg_data.code) {
        case 'initDecoder':
            console.log('Worker initDecoder', self.worker.initDecoder)
            self.worker.initDecoder(msg_data.url, msg_data.size);
            break;
        case 'uninitDecoder':
            this.uninitDecoder();
            break;
        case 'openDecoder':
            console.log('Worker openDecoder')
            self.worker.openDecoder();
            break;
        case 'closeDecoder':
            self.worker.closeDecoder();
            break;
        case 'startDecoding':
            self.worker.startDecoding();
            break;
        case 'pauseDecoding':
            self.worker.pauseDecoding();
            break;
        case 'sendData':
            self.worker.sendData(req.d);
            break;
        case 'seekTo':
            self.worker.seekTo(req.ms);
            break;
        default:
            console.log("Unsupport messsage " + evt.code);
    }
};
function onWasmLoaded() {
    if (self.worker) {
        self.worker.onWasmLoaded();
    } else {
        console.log("worker error!");
    }
}

