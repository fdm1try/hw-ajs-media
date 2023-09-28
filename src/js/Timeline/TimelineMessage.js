import moment from 'moment';

export default class TimelineMessage {
  static get markup() {
    return `
      <div class="timeline-message">
        <div class="timeline-message-body">          
          <div class="timeline-message-content"></div>
          <div class="timeline-message-date"></div>
        </div>
        <div class="timeline-message-footer">
          <div class="timeline-message-footer-location"></div>
        </div>
      </div>
    `;
  }

  constructor(content = '', locationInfo = '', date = new Date()) {
    this.date = date;
    this.container = document.createElement('div');
    this.container.classList.add('timeline-message-container');
    this.container.innerHTML = TimelineMessage.markup;

    this.elDate = this.container.querySelector('.timeline-message-date');
    this.elContent = this.container.querySelector('.timeline-message-content');
    this.elLocationInfo = this.container.querySelector('.timeline-message-footer-location');

    this.elDate.textContent = moment(date).format('DD.MM.YYYY HH:MM');
    this.elContent.innerText = content;
    this.elLocationInfo.textContent = locationInfo;
  }
}
