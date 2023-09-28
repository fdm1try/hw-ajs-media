import TimelineMessage from './TimelineMessage';

export default class TimelineVideoMessage extends TimelineMessage {
  constructor(videoBlob, locationInfo, date) {
    super('', locationInfo, date);
    this.elContent.innerHTML = '';
    this.elMediaContent = document.createElement('video');
    this.elMediaContent.classList.add('timeline-message-content-video');
    this.elMediaContent.setAttribute('controls', true);
    this.elMediaContent.src = URL.createObjectURL(videoBlob);
    this.elContent.appendChild(this.elMediaContent);
  }
}
