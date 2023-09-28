import TimelineMessage from './TimelineMessage';

export default class TimelineAudioMessage extends TimelineMessage {
  constructor(audioBlob, locationInfo, date) {
    super('', locationInfo, date);
    this.elContent.innerHTML = '';
    this.elMediaContent = document.createElement('audio');
    this.elMediaContent.setAttribute('controls', true);
    this.elMediaContent.classList.add('timeline-message-content-audio');
    this.elMediaContent.src = URL.createObjectURL(audioBlob);
    this.elContent.appendChild(this.elMediaContent);
  }
}
