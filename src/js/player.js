
function Player(options) {
    this.width = 0;
    this.height = 0;
    this.url = '';

    this.videoWidth = 0;
    this.videoHeight = 0;

    this.beginTimeOffset = 0;
    this.currentTime = 0;
    this.duration = 0


    this.audioEncoding = "";
    this.audioChannels = 0;
    this.audioSampleRate = 0;

    this.firstAudioFrame = true;
    this.isVideoCanPlay = false;
    this.isAudioCanPlay = false;

    this.pauseTime = 0;
    this.playTimer = null;
    this.startTime = null;
    this.video_frame_buffer = [];
    this.audio_frame_buffer = [];
    this.fileSize = 0;


    this.DecodeFinished = false;
    this.canvas = null;
    this.worker = null;
    this.pcmPlayer = null;
    this.webglPlayer = null;


}

Player.prototype.createPlayer = function (options) {
    console.log('Player init')
    this.url = options.url ? options.url : ''
    this.width = options.width ? options.width : 0
    this.height = options.height ? options.height : 0
    this.canvas = options.canvas ? options.canvas : nul
    // 下载worker,在初始化命令中
    this.worker = new Worker("src/js/worker.js");
    // 创建了worker的监听
    let self = this
    this.worker.onmessage = function (evt) {
        let msg_data = evt.data
        switch (msg_data.code) {
            case 'onOpenDecoder':
                console.log('onmessage onOpenDecoder', msg_data)
                self.onOpenDecoder(msg_data)
                break;
            case 'onVideoFrame':
                // console.log('onmessage onVideoFrame', msg_data)
                self.isVideoCanPlay = true
                let video_frame_data = {
                    data: msg_data.data,
                    timestamp: msg_data.timestamp,
                }
                self.video_frame_buffer.push(video_frame_data)

                // console.log('self.audio_frame_buffer.length',self.audio_frame_buffer.length)
                // console.log('self.video_frame_buffer.length',self.video_frame_buffer.length)
                if (self.audio_frame_buffer.length > 100 && self.video_frame_buffer.length >100) {
                    let message_data = {
                        code: 'pauseDecoding'
                    }
                    self.worker.postMessage(message_data)
                }

                break;
            case 'onAudioFrame':
                // console.log('onmessage onAudioFrame', msg_data)
                self.isAudioCanPlay = true

                if (self.firstAudioFrame) {
                    self.firstAudioFrame = false;
                    self.beginTimeOffset = msg_data.timestamp;
                }
                let audio_frame_data = {
                    data: msg_data.data,
                    timestamp: msg_data.timestamp,
                }
                self.audio_frame_buffer.push(audio_frame_data)

                // console.log('self.audio_frame_buffer.length',self.audio_frame_buffer.length)
                // console.log('self.video_frame_buffer.length',self.video_frame_buffer.length)
                // if (self.audio_frame_buffer.length > 100 && self.video_frame_buffer.length >100) {
                //     let message_data = {
                //         code: 'pauseDecoding'
                //     }
                //     self.worker.postMessage(message_data)
                // }else{
                //     let message_data = {
                //         code: 'startDecoding'
                //     }
                //     self.worker.postMessage(message_data)
                // }

                break;
            case 'DecodeFinished':
                console.log('onmessage onOpenDecoder', msg_data)
                self.DecodeFinished = true
                self.onOpenDecoder(msg_data)
                break;
        }
    }

    this.webglPlayer = new WebGLPlayer(canvas, {
        preserveDrawingBuffer: false
    });
    this.getFileInfoByHttp(this.url)
}

Player.prototype.getFileInfoByHttp = function (url) {
    console.log('Player getFileInfoByHttp', url)
    var size = 0;
    var status = 0;
    var reported = false;
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    var self = this;

    xhr.onreadystatechange = () => {
        var len = xhr.getResponseHeader("Content-Length");
        if (len) {
            size = len;
        }
        if (xhr.status) {
            status = xhr.status;
        }
        //Completed.
        if (!reported && ((size > 0 && status > 0) && xhr.readyState == 4)) {
            fileSize = size
            // worker.initDecoder(size)
            var message_data = {
                code: 'initDecoder',
                url: url,
                size: size
            };

            this.worker.postMessage(message_data);
            xhr.abort();
        }
    };
    xhr.send();
}

Player.prototype.onOpenDecoder = function (objData) {
    console.log('onOpenDecoder objData', objData)
    if (objData.data == 0) {
        this.onVideoParam(objData.video);
        this.onAudioParam(objData.audio);
        var message_data = {
            code: 'startDecoding',

        };

        this.worker.postMessage(message_data);

    } else {
        // this.reportPlayError(objData.e);
        console.log(objData.e)
    }

};

// onVideoParam
Player.prototype.onVideoParam = function (video) {
    // if (this.playerState == playerStateIdle) {
    //     return;
    // }

    console.log("Video param duation:" + video.duration + " pixFmt:" + video.videoPixFmt + " width:" + video.videoWidth + " height:" + video.videoHeight + ".");
    this.duration = video.duration;
    this.pixFmt = video.videoPixFmt;
    console.log('player.canvas.width', this.canvas.width)

    if (video.videoWidth > video.videoHeight) {
        this.canvas.width = this.width;
        this.canvas.height = this.width / video.videoWidth * video.videoHeight;
    } else {
        this.canvas.width = this.height / video.videoHeight * video.videoWidth;
        this.canvas.height = this.height;
    }

    this.videoWidth = video.videoWidth;
    this.videoHeight = video.videoHeight;
    this.yLength = this.videoWidth * this.videoHeight;
    this.uvLength = (this.videoWidth / 2) * (this.videoHeight / 2);

};
// onVideoParam
Player.prototype.onAudioParam = function (audio) {
    // if (this.playerState == playerStateIdle) {
    //     return;
    // }

    console.log("Audio param sampleFmt:" + audio.audioSampleFmt + " channels:" + audio.audioChannels + " sampleRate:" + audio.audioSampleRate + ".");

    var sampleFmt = audio.audioSampleFmt;
    var channels = audio.audioChannels;
    var sampleRate = audio.audioSampleRate;

    var encoding = "16bitInt";
    switch (sampleFmt) {
        case 0:
            encoding = "8bitInt";
            break;
        case 1:
            encoding = "16bitInt";
            break;
        case 2:
            encoding = "32bitInt";
            break;
        case 3:
            encoding = "32bitFloat";
            break;
        default:
            console.log("Unsupported audio sampleFmt " + sampleFmt + "!");
    }
    console.log("Audio encoding " + encoding + ".");

    this.pcmPlayer = new PCMPlayer({
        encoding: encoding,
        channels: channels,
        sampleRate: sampleRate,
        flushingTime: 5000
    });

    this.audioEncoding = encoding;
    this.audioChannels = channels;
    this.audioSampleRate = sampleRate;
};

Player.prototype.play = function () {
    console.log('video_audio_play')   
    if(this.pcmPlayer.audioCtx.state === 'suspended'){
        this.pcmPlayer.resume()
    }   
    let self = this
    clearInterval(this.playTimer)
    this.startTime = new Date().getTime()    
    this.playTimer = setInterval(function () {
        if (self.isVideoCanPlay = true && self.isAudioCanPlay == true) {
            let current_time = new Date().getTime();
          
            if (self.audio_frame_buffer.length > 0) {               
                let delay = self.audio_frame_buffer[0].timestamp - (current_time/1000 - self.startTime/1000) - self.pauseTime ;              
                if (delay <= 0) {
                    self.pcmPlayer.play(self.audio_frame_buffer[0].data);
                    self.audio_frame_buffer.shift();
                }
            }
            if (self.video_frame_buffer.length > 0) {             
                let delay = self.video_frame_buffer[0].timestamp - (current_time/1000 - self.startTime/1000) - self.pauseTime ;;               
                self.currentTime = current_time/1000 - self.startTime/1000 + self.pauseTime;  
                if (delay <= 0) {
                    self.webglPlayer.renderFrame(self.video_frame_buffer[0].data, self.videoWidth, self.videoHeight, self.yLength, self.uvLength);
                    self.video_frame_buffer.shift();
                }
            }
            if (self.audio_frame_buffer.length == 0 && self.video_frame_buffer.length == 0) {
                self.isVideoCanPlay = false
                self.isAudioCanPlay = false
                clearInterval(self.playTimer)
            }
            if (self.audio_frame_buffer.length < 100 && self.video_frame_buffer.length <100 && self.DecodeFinished == false) {
                let message_data = {
                    code: 'startDecoding'
                }
                self.worker.postMessage(message_data)
            }


        }else{
            
        }

    }, 10)
}

Player.prototype.fullscreen = function () {
    this.webglPlayer.fullscreen()
}

Player.prototype.pause = function () {   
    this.pcmPlayer.pause()
    this.pauseTime = this.currentTime;
    clearInterval(this.playTimer)
    let message_data = {
        code: 'pauseDecoding'
    }
    this.worker.postMessage(message_data)
}


Player.prototype.stop = function () {   

    clearInterval(this.playTimer)
    this.playTimer = null;
    this.pcmPlayer.pause()

    let message_data = {
        code: 'pauseDecoding'
    }
    this.worker.postMessage(message_data)

    this.videoWidth = 0;
    this.videoHeight = 0;

    this.currentTime = 0;
    this.audioEncoding = "";
    this.audioChannels = 0;
    this.audioSampleRate = 0;

    this.startTime = null;
    this.video_frame_buffer = [];
    this.audio_frame_buffer = [];

    this.DecodeFinished = false;    

}