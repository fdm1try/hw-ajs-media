export default class Timeline {
  static get markup() {
    return `
      <div class="timeline">
        <div class="timeline-sidebar"></div>
        <div class="timeline-messages"></div>
      </div>
    `;
  }

  constructor() {
    this.rootElement = document.body;
    this.container = document.createElement('div');
    this.container.classList.add('timeline-container');
  }

  bindToDOM(element) {
    this.rootElement = element;
  }

  render() {
    this.container.innerHTML = Timeline.markup;
    this.rootElement.appendChild(this.container);

    this.elMessagesList = this.container.querySelector('.timeline-messages');
    this.elSidebar = this.container.querySelector('.timeline-sidebar');
  }

  addMessage(message) {
    this.elMessagesList.appendChild(message.container);
  }
}
