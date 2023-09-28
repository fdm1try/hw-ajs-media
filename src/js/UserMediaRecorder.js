export default class UserMediaRecorder {
  constructor() {
    this.initializationPromise = null;
    this.initialized = false;
    this.onMediaStreamStart = this.onMediaStreamStart.bind(this);
    this.onMediaStreamError = this.onMediaStreamError.bind(this);
  }

  init(audio, video) {
    return new Promise((resolve, reject) => {
      if (!audio && !video) {
        reject(new Error('Please specify audio or video interface to record!'));
        return;
      }
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        reject(new Error('Browser does not support media devices capture.'));
        return;
      }
      this.initializationPromise = { resolve, reject };
      navigator.mediaDevices.getUserMedia({ audio, video })
        .then(this.onMediaStreamStart)
        .catch(this.onMediaStreamError);
    });
  }

  onMediaStreamStart(stream) {
    this.stream = stream;
    this.recorder = new MediaRecorder(stream);
    this.initializationPromise.resolve(this);
    this.initialized = true;
  }

  onMediaStreamError(error) {
    this.initializationPromise.reject(error);
  }

  startRecord(onRecord, onError) {
    this.callbackOnError = onError;
    this.callbackOnRecord = onRecord;
    this.recorder.onerror = this.onError;
    this.recorder.ondataavailable = this.onRecord;
    this.chunks = [];
    this.recorder.start();
    this.mimeType = this.recorder.mimeType;
  }

  stopRecord() {
    this.recorder.stop();
    this.callbackOnError = null;
    this.callbackOnRecord = null;
    this.recorder = null;
    this.stream = null;
    return { data: this.chunks, mimeType: this.mimeType };
  }

  onRecord(event) {
    this.chunks.push(event.data);
    if (typeof this.callbackOnRecord === 'function') {
      this.callbackOnRecord(this);
    }
  }

  onError(error) {
    if (typeof this.callbackOnError === 'function') {
      this.callbackOnError(error);
    }
  }
}
