import TimelineMessage from './TimelineMessage';
import TimelineAudioMessage from './TimelineAudioMessage';
import TimelineVideoMessage from './TimelineVideoMessage';
import ModalInfo from '../Modal/ModalInfo';
import ModalTextInput from '../Modal/ModalTextInput';
import TimelineRecordWidget from './TimelineRecordWidget';

const RE_COORDS = /^(?<latitude>-?\d+(\.\d+)?),\s*(?<longitude>-?\d+(\.\d+)?)$/;

export default class TimelineInput {
  static get markup() {
    return `
      <div class="timeline-editor">
        <form class="timeline-editor-form">
          <input required type="text" class="timeline-editor-form-text_input" placeholder="Введите текст сообщения...">
        </form>
        <div class="timeline-editor-controls">
          <button type="button" class="timeline-editor-new-audio_button">🎵</button>
          <button type="button" class="timeline-editor-new-video_button">📹</button>
        </div>
      </div>
    `;
  }

  constructor() {
    this.rootElement = document.body;
    this.container = document.createElement('div');
    this.container.classList.add('timeline-editor-container');

    this.recordWidget = new TimelineRecordWidget();

    this.newMessageListeners = [];

    this.modalCoordsInput = new ModalTextInput('Что-то пошло не так', `\
      К сожалению, нам не удалось определить ваше местоположение, пожалуйста, \
      дайте разрешение на использование геолокации, либо введите координаты вручную.

      Широта и долгота через запятую
    `);
    this.modalCoordsInput.addValidator((value) => {
      const matches = RE_COORDS.exec(value);
      if (!matches || matches.length < 3) { return 'Ошибка формата! Укажите координаты через запятую, например: 51.50851, -0.12572'; }
      const { latitude, longitude } = matches.groups;
      const [lat, lng] = [latitude, longitude].map(parseFloat);
      if (lat > 90 || lat < -90) { return 'Широта должна быть указана в диапазоне от -90° до 90°'; }
      if (lng > 180 || lng < -180) { return 'Долгота должна быть указана в диапазоне от -180° до 180°'; }
      return null;
    });

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onNewAudioBtnClick = this.onNewAudioBtnClick.bind(this);
    this.onNewVideoBtnClick = this.onNewVideoBtnClick.bind(this);
    this.onRecordStart = this.onRecordStart.bind(this);
    this.onRecordFinish = this.onRecordFinish.bind(this);
  }

  bindToDOM(element) {
    this.rootElement = element;
  }

  render() {
    this.container.innerHTML = TimelineInput.markup;

    this.elForm = this.container.querySelector('.timeline-editor-form');
    this.elTextInput = this.container.querySelector('.timeline-editor-form-text_input');
    this.elControls = this.container.querySelector('.timeline-editor-controls');
    this.elNewAudioBtn = this.container.querySelector('.timeline-editor-new-audio_button');
    this.elNewVideoBtn = this.container.querySelector('.timeline-editor-new-video_button');

    this.rootElement.appendChild(this.container);
    this.registerEvents();
  }

  registerEvents() {
    this.elForm.addEventListener('submit', this.onFormSubmit);
    this.elNewAudioBtn.addEventListener('click', this.onNewAudioBtnClick);
    this.elNewVideoBtn.addEventListener('click', this.onNewVideoBtnClick);
  }

  validateTextInput() {
    const content = this.elTextInput.value.trim();
    if (!content.length) return false;
    return true;
  }

  requestGeolocationInput() {
    let onSuccess;
    let onCancel;
    return new Promise((resolve, reject) => {
      onSuccess = (value) => {
        const matches = RE_COORDS.exec(value);
        const { latitude, longitude } = matches.groups;
        this.modalCoordsInput.removeSubmitListener(onSuccess);
        this.modalCoordsInput.removeCancelListener(onCancel);
        resolve([latitude, longitude].map(parseFloat));
      };

      onCancel = () => {
        this.modalCoordsInput.removeSubmitListener(onSuccess);
        this.modalCoordsInput.removeCancelListener(onCancel);
        reject(new Error('The modal window is closed with the cancel button'));
      };

      this.modalCoordsInput.addSubmitListener(onSuccess);
      this.modalCoordsInput.addCancelListener(onCancel);
      this.modalCoordsInput.render();
    });
  }

  requestGeolocation() {
    return new Promise((resolve, reject) => {
      const onError = () => this.requestGeolocationInput().then(resolve).catch(reject);
      if (!navigator.geolocation) onError();
      else {
        navigator.geolocation.getCurrentPosition((position) => {
          resolve([position.coords.latitude, position.coords.longitude]);
        }, onError);
      }
    });
  }

  addNewMessageListener(callback) {
    this.newMessageListeners.push(callback);
  }

  onNewMessage(message) {
    this.newMessageListeners.forEach((callback) => callback(message));
  }

  onFormSubmit(event) {
    event.preventDefault();
    if (!this.validateTextInput()) {
      this.elTextInput.setCustomValidity('Сообщение не может быть пустым');
      this.elTextInput.reportValidity();
      return;
    }
    this.elTextInput.disabled = true;
    this.requestGeolocation().then((coords) => {
      const [lat, lng] = coords.map((coord) => coord.toFixed(5));
      const content = this.elTextInput.value;
      const locationInfo = `[${lat}, ${lng}]`;
      const message = new TimelineMessage(content, locationInfo);
      this.elTextInput.value = '';
      this.onNewMessage(message);
    }).catch((error) => {
      console.log(error.message);
    }).finally(() => {
      this.elTextInput.disabled = false;
    });
  }

  onRecordStart() {
    this.elControls.innerHTML = '';
    this.elControls.appendChild(this.recordWidget.container);
  }

  onRecordFinish() {
    this.elControls.innerHTML = '';
    this.elControls.appendChild(this.elNewAudioBtn);
    this.elControls.appendChild(this.elNewVideoBtn);
  }

  async onNewAudioBtnClick() {
    let locationInfo;
    try {
      const coords = await this.requestGeolocation();
      const [lat, lng] = coords.map((coord) => coord.toFixed(5));
      locationInfo = `[${lat}, ${lng}]`;
    } catch (error) {
      console.log(error.message);
      return;
    }
    try {
      await this.recordWidget.recordStart(true);
      this.onRecordStart();
    } catch (error) {
      const modal = new ModalInfo(
        'Что-то пошло не так',
        `Не удалось получить доступ к микрофону (${error.message}).`,
      );
      modal.render();
      return;
    }
    let audioBlob;
    try {
      audioBlob = await this.recordWidget.recordFinish();
    } catch (error) {
      const modal = new ModalInfo(
        'Что-то пошло не так',
        `Во время записи произошла ошибка(${error.message}).`,
      );
      modal.render();
      return;
    }
    if (audioBlob) {
      const message = new TimelineAudioMessage(audioBlob, locationInfo);
      this.onNewMessage(message);
    }
    this.onRecordFinish();
  }

  async onNewVideoBtnClick() {
    let locationInfo;
    try {
      const coords = await this.requestGeolocation();
      const [lat, lng] = coords.map((coord) => coord.toFixed(5));
      locationInfo = `[${lat}, ${lng}]`;
    } catch (error) {
      console.log(error.message);
      return;
    }
    let elVideoPreview;
    try {
      await this.recordWidget.recordStart(true, true);
      this.onRecordStart();
      const stream = new MediaStream();
      for (const track of this.recordWidget.recorder.stream.getVideoTracks()) {
        stream.addTrack(track);
      }
      elVideoPreview = document.createElement('video');
      elVideoPreview.classList.add('timeline-editor-video-preview');
      elVideoPreview.style.bottom = `${this.container.offsetHeight}px`;
      elVideoPreview.addEventListener('canplay', elVideoPreview.play);
      elVideoPreview.srcObject = stream;
      document.body.appendChild(elVideoPreview);
    } catch (error) {
      const modal = new ModalInfo(
        'Что-то пошло не так',
        `Не удалось получить доступ к микрофону или камере(${error.message}).`,
      );
      modal.render();
      return;
    }
    let videoBlob;
    try {
      videoBlob = await this.recordWidget.recordFinish();
      elVideoPreview.remove();
    } catch (error) {
      const modal = new ModalInfo(
        'Что-то пошло не так',
        `Во время записи произошла ошибка(${error.message}).`,
      );
      modal.render();
      return;
    }
    if (videoBlob) {
      const message = new TimelineVideoMessage(videoBlob, locationInfo);
      this.onNewMessage(message);
    }
    this.onRecordFinish();
  }
}
