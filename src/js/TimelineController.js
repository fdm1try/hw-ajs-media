import Timeline from './Timeline/Timeline';
import TimelineInput from './Timeline/TimelineInput';

export default class TimelineController {
  constructor() {
    this.rootElement = document.body;

    this.timeline = new Timeline();
    this.timelineEditor = new TimelineInput();

    this.onNewMessage = this.onNewMessage.bind(this);

    this.registerEvents();
  }

  bindToDOM(element) {
    this.rootElement = element;
  }

  registerEvents() {
    this.timelineEditor.addNewMessageListener(this.onNewMessage);
  }

  onNewMessage(message) {
    this.timeline.addMessage(message);
  }

  render() {
    this.timeline.bindToDOM(this.rootElement);
    this.timeline.render();
    this.timelineEditor.bindToDOM(this.timeline.container);
    this.timelineEditor.render();
  }
}
