const STATE = {
  RECORDING: 'recording',
  CANCELED: 'canceled',
  FINISHED: 'finished',
  INIT: 'init',
};

export default class TimelineRecordWidget {
  static get markup() {
    return `
      <button class="timeline-record-confirm_button">✓</button>
      <span class="timeline-record-time"></span>
      <button class="timeline-record-cancel_button">✖</button>
    `;
  }

  static initMediaStream(audio, video) {
    return new Promise((resolve, reject) => {
      if (!audio && !video) {
        reject(new Error('Please specify audio or video interface to record!'));
        return;
      }
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        reject(new Error('Browser does not support media devices capture.'));
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio, video })
        .then(resolve)
        .catch(reject);
    });
  }

  constructor() {
    this.state = STATE.INIT;
    this.container = document.createElement('div');
    this.container.classList.add('timeline-record');
    this.container.innerHTML = TimelineRecordWidget.markup;

    this.elTimer = this.container.querySelector('.timeline-record-time');
    this.elConfirmButton = this.container.querySelector('.timeline-record-confirm_button');
    this.elCancelButton = this.container.querySelector('.timeline-record-cancel_button');

    this.updateTimer = this.updateTimer.bind(this);
    this.onRecordStart = this.onRecordStart.bind(this);
    this.onRecordData = this.onRecordData.bind(this);
    this.onRecordStop = this.onRecordStop.bind(this);
    this.reset = this.reset.bind(this);
    this.onRecordStopButtonClick = this.onRecordStopButtonClick.bind(this);
    this.onRecordCancelButtonClick = this.onRecordCancelButtonClick.bind(this);

    this.reset();
    this.registerEvents();
  }

  registerEvents() {
    this.elConfirmButton.addEventListener('click', this.onRecordStopButtonClick);
    this.elCancelButton.addEventListener('click', this.onRecordCancelButtonClick);
  }

  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.recordingStartedAt) / 1000);
    const seconds = (`0${elapsed % 60}`).slice(-2);
    const minutes = (`0${Math.floor(elapsed / 60)}`).slice(-2);
    this.elTimer.textContent = `${minutes}:${seconds}`;
    if (this.state === STATE.RECORDING) {
      window.requestAnimationFrame(this.updateTimer);
    }
  }

  async recordStart(audio, video) {
    this.state = STATE.INIT;
    const stream = await TimelineRecordWidget.initMediaStream(audio, video);
    const recorder = new MediaRecorder(stream);
    this.recordChunks = [];
    recorder.addEventListener('dataavailable', this.onRecordData);
    recorder.addEventListener('start', this.onRecordStart);
    recorder.addEventListener('error', this.onRecordError);
    recorder.addEventListener('stop', this.onRecordStop);
    recorder.start();
    this.recorder = recorder;
  }

  recordFinish() {
    return new Promise((resolve, reject) => {
      if (this.state === STATE.CANCELED) {
        resolve();
      } else if (this.state === STATE.FINISHED) {
        const blob = new Blob(this.recordChunks, { type: this.recorder.mimeType });
        this.recordingPromise.resolve(blob);
        this.reset();
      } else {
        this.recordingPromise = { resolve, reject };
      }
    });
  }

  onRecordError(error) {
    if (this.recordingPromise && this.recordingPromise.reject) {
      this.recordingPromise.reject(error);
      this.reset();
    }
  }

  onRecordStart() {
    this.state = STATE.RECORDING;
    this.elConfirmButton.enabled = true;
    this.elCancelButton.enabled = true;
    this.recordingStartedAt = Date.now();
    this.updateTimer();
  }

  onRecordData(event) {
    this.recordChunks.push(event.data);
  }

  onRecordStop() {
    if (this.state === STATE.CANCELED) {
      if (this.recordingPromise && this.recordingPromise.resolve) {
        this.recordingPromise.resolve();
        this.reset();
      }
    } else if (this.state === STATE.FINISHED) {
      const blob = new Blob(this.recordChunks, { type: this.recorder.mimeType });
      if (this.recordingPromise && this.recordingPromise.resolve) {
        this.recordingPromise.resolve(blob);
        this.reset();
      }
    } else {
      throw new Error(`Unreachable recording state: ${this.state}.`);
    }
    for (const track of this.recorder.stream.getTracks()) {
      track.stop();
    }
  }

  onRecordStopButtonClick() {
    this.state = STATE.FINISHED;
    this.recorder.stop();
  }

  onRecordCancelButtonClick() {
    this.state = STATE.CANCELED;
    this.recorder.stop();
  }

  reset() {
    this.recordingPromiseHandler = undefined;
    this.recordingPromise = undefined;
    this.recordingStartedAt = undefined;
    this.recordMimeType = undefined;
    this.elConfirmButton.enabled = false;
    this.elCancelButton.enabled = false;
  }
}
