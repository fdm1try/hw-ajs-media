export default class Modal {
  constructor(title) {
    this.renderListeners = [];

    this.render = this.render.bind(this);
    this.close = this.close.bind(this);

    this.container = document.createElement('div');
    this.container.classList.add('modal-container');
    this.container.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">${title}</h2>
      </div>
    `;

    this.elModal = this.container.querySelector('.modal');
    this.elTitle = this.container.querySelector('.modal-title');
  }

  get title() {
    return this.elTitle.textContent;
  }

  set title(text) {
    this.elTitle.textContent = text;
  }

  render(el = document.body) {
    el.appendChild(this.container);
    this.renderListeners.forEach((callback) => callback(this));
  }

  close() {
    this.container.remove();
  }
}
