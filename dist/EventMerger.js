class EventMerger {
  constructor(handler, minBufferTimeMs = 250, maxBufferTimeMs) {
    if (typeof handler !== "function") EventMerger.error_handler(new Error("No valid handler function provided for EventMerger!"));
    if (typeof minBufferTimeMs !== "number" || minBufferTimeMs < 0) EventMerger.error_handler(new Error("minBufferTimeMs must be a positive number!"));
    this.minBufferTimeMs = minBufferTimeMs;

    // if maxBufferTimeMs is not provided or is smaller than minBufferTimeMs, set it to minBufferTimeMs
    this.maxBufferTimeMs = maxBufferTimeMs ? (maxBufferTimeMs >= minBufferTimeMs ? maxBufferTimeMs : minBufferTimeMs) : minBufferTimeMs;
    
    this.queue = {};
    this.handler = handler;
  }

  // add-function: used to add an event to the merger
  // first argument must be the unique identifier, second argument can be a number and will be added to stack on every supressed event
  add() {
    try {
      const id = (arguments[0] || typeof arguments[0] === "number") ? encodeURI(arguments[0]) : null;
      if (id === null) return EventMerger.error_handler(new Error("No valid id provided for event: \"" + (arguments && arguments[0]) + "\""));
      if (typeof this.queue == "undefined") return EventMerger.error_handler(new Error("EventMerger queue is not defined! Event: " + (arguments && arguments[0] || "undefined")));

      // if there is already a event with the same id in the queue, update the existing event instead of creating a new one
      if (this.queue && this.queue[id]) {
        const queue = this.queue[id];
        queue.dup++;

        // if the second argument is a number, add it to the stack of the existing event and update the arguments of the existing event
        if (typeof arguments[1] == "number") {
          queue.stack += arguments[1];
          arguments[1] = queue.stack;
          queue.args = Array.from(arguments);
        }

        // if the max buffer time has passed, clear the current timeout and execute the handler immediately
        if (queue.start + this.maxBufferTimeMs < Date.now()) {
          clearTimeout(queue.timeout);
          this.releaseQueue(id, queue);
        } else {
          // otherwise, reset the timeout to execute the handler after the remaining buffer time
          this.scheduleQueueRelease(id, queue);
        }
      } else {
        // create a new event in the queue
        const queue = this.queue[id] = {
          args: Array.from(arguments),
          dup: 1,
          handler: this.handler,
          stack: typeof arguments[1] == "number" ? arguments[1] : 0,
          start: Date.now()
        };
        this.scheduleQueueRelease(id, queue);
      }
    } catch (error) { EventMerger.error_handler(error); }
  }

  scheduleQueueRelease(id, queue) {
    clearTimeout(queue.timeout);
    queue.timeout = setTimeout(() => {
      this.releaseQueue(id, queue);
    }, this.minBufferTimeMs);
  }

  releaseQueue(id, queue) {
    try {
      this.runHandler(queue);
    } catch (error) {
      EventMerger.error_handler(error);
    } finally {
      delete this.queue[id];
    }
  }

  runHandler(queue) {
    queue.handler.apply({ queue: queue }, queue.args);
  }
};

EventMerger.error_handler = function (error) {
  console.error("[EventMerger.error_handler] ", error, error.stack);
};

// Export for Node (CommonJS)
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = EventMerger;
}

// Export for browser
if (typeof window !== "undefined") {
  window.EventMerger = EventMerger;
}
