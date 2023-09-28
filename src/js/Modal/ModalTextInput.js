import Modal from './Modal';

export default class ModalTextInput extends Modal {
  static get markup() {
    return `
      <div class="modal-content"></div>
      <form class="modal-form" novalidate>
        <input required class="modal-input" type="text">
        <div class="modal-controls">
          <button class="modal-controls-confirm_button">Ok</button>
          <button type="button" class="modal-controls-cancel_button">Отмена</button>
        </div>
      </form>
    `;
  }

  constructor(title, text) {
    super(title);
    this.validators = [];
    this.submitListeners = [];
    this.cancelListeners = [];

    this.elModal.insertAdjacentHTML('beforeend', ModalTextInput.markup);

    this.elContent = this.container.querySelector('.modal-content');
    this.elForm = this.container.querySelector('.modal-form');
    this.elTextInput = this.container.querySelector('.modal-input');
    this.elCancelButton = this.container.querySelector('.modal-controls-cancel_button');

    this.content = text;

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onRender = this.onRender.bind(this);

    this.registerEvents();
  }

  get userInput() {
    return this.elTextInput.value;
  }

  get content() {
    return this.elContent.outerText;
  }

  set content(text) {
    this.elContent.innerText = text;
  }

  registerEvents() {
    this.elForm.addEventListener('submit', this.onFormSubmit);
    this.elCancelButton.addEventListener('click', this.onCancel);
    this.renderListeners.push(this.onRender);
  }

  addValidator(callback) {
    this.validators.push(callback);
  }

  addSubmitListener(callback) {
    this.submitListeners.push(callback);
  }

  removeSubmitListener(callback) {
    this.submitListeners = this.submitListeners.filter((cb) => cb !== callback);
  }

  addCancelListener(callback) {
    this.cancelListeners.push(callback);
  }

  removeCancelListener(callback) {
    this.cancelListeners = this.cancelListeners.filter((cb) => cb !== callback);
  }

  validate() {
    const input = this.userInput;
    for (const validator of this.validators) {
      const error = validator(input);
      if (error) {
        this.onValidationError(error);
        return false;
      }
    }
    return true;
  }

  onRender() {
    this.elTextInput.value = '';
    this.elTextInput.focus();
  }

  onValidationError(errorMsg = 'Unknown error') {
    this.elTextInput.setCustomValidity(errorMsg);
    this.elTextInput.reportValidity();
  }

  onFormSubmit(event) {
    event.preventDefault();
    if (this.validate()) {
      this.submitListeners.forEach((callback) => callback(this.elTextInput.value));
      this.close();
    }
  }

  onCancel() {
    this.cancelListeners.forEach((callback) => callback(this));
    this.close();
  }
}
