import Modal from './Modal';

export default class ModalInfo extends Modal {
  static get markup() {
    return `
      <div class="modal-content"></div>
      <div class="modal-controls">
        <button type="button" class="modal-controls-confirm_button">Ok</button>
      </div>
    `;
  }

  constructor(title, text) {
    super(title);

    this.elModal.insertAdjacentHTML('beforeend', ModalInfo.markup);

    this.elContent = this.container.querySelector('.modal-content');
    this.elConfirmButton = this.container.querySelector('.modal-controls-confirm_button');

    this.content = text;

    this.registerEvents();
  }

  get content() {
    return this.elContent.textContent;
  }

  set content(text) {
    this.elContent.textContent = text;
  }

  registerEvents() {
    this.elConfirmButton.addEventListener('click', this.close);
  }
}
