(function () {
  const logEvent1El = document.getElementById("log-event1");
  const logEvent2El = document.getElementById("log-event2");
  const logEvent3El = document.getElementById("log-event3");
  const logResultEl = document.getElementById("log-result");
  const event1CountInput = document.getElementById("event1-count");
  const event1DelayInput = document.getElementById("event1-delay");
  const event2CountInput = document.getElementById("event2-count");
  const event2DelayInput = document.getElementById("event2-delay");
  const event3CountInput = document.getElementById("event3-count");
  const event3DelayInput = document.getElementById("event3-delay");
  const event3InputSlider = document.getElementById("event3-input-slider");
  const event3OutputSlider = document.getElementById("event3-output-slider");
  const event3InputValueEl = document.getElementById("event3-input-value");
  const event3OutputValueEl = document.getElementById("event3-output-value");
  const testMinBufferInput = document.getElementById("test-min-buffer");
  const testMaxBufferInput = document.getElementById("test-max-buffer");
  const demoState = {
    eventLogRows: {
      event1: [],
      event2: [],
      event3: []
    },
    handledEventCount: {
      event1: 0,
      event2: 0,
      event3: 0
    },
    sliderDispatchTimeouts: [],
    sliderMerger: null,
    start: Date.now()
  };

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clearLog(container) {
    container.replaceChildren();
  }

  function appendExistingLogLine(container, lineEl) {
    container.appendChild(lineEl);
    container.scrollTop = container.scrollHeight;
  }

  function elapsedMs() {
    return Math.round(new Date().getTime() - demoState.start);
  }

  function sanitizeNonNegativeInteger(value) {
    const parsedValue = parseInt(value, 10);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return 0;
    }

    return parsedValue;
  }

  function updateSliderValue(sliderEl, outputEl, value) {
    sliderEl.value = value;
    outputEl.value = value;
    outputEl.textContent = value;
  }

  function clearPendingSliderDispatches() {
    while (demoState.sliderDispatchTimeouts.length) {
      clearTimeout(demoState.sliderDispatchTimeouts.pop());
    }
  }

  function resetDemoState(startTime) {
    demoState.start = startTime;
    demoState.eventLogRows.event1 = [];
    demoState.eventLogRows.event2 = [];
    demoState.eventLogRows.event3 = [];
    demoState.handledEventCount.event1 = 0;
    demoState.handledEventCount.event2 = 0;
    demoState.handledEventCount.event3 = 0;
    demoState.sliderMerger = null;
    clearPendingSliderDispatches();
    updateSliderValue(event3OutputSlider, event3OutputValueEl, event3InputSlider.value);
    updateSliderValue(event3InputSlider, event3InputValueEl, event3InputSlider.value);
  }

  function createEvent3SliderMerger(minBufferTimeMs, maxBufferTimeMs) {
    demoState.sliderMerger = new EventMerger(function () {
      const eventName = arguments[0];
      const lastValue2 = arguments[2];

      demoState.handledEventCount[eventName] += 1;
      demoState.handledEventCount[eventName] += this.queue.dup - 1;

      updateSliderValue(event3OutputSlider, event3OutputValueEl, lastValue2);
      appendLogLine(
        logResultEl,
        "[" +
        elapsedMs() +
        "ms] Handle: event3 input, dup: " +
        this.queue.dup +
        ", total slider moves merged: " +
        this.queue.stack +
        ", output position: " +
        lastValue2,
        eventName
      );
      markHandledEventRow(demoState.eventLogRows[eventName], demoState.handledEventCount[eventName] - 1, eventName);
    }, minBufferTimeMs, maxBufferTimeMs);
  }

  function queueEvent3SliderInput(sliderValue, inputDelayMs) {
    const lineEl = createLogLine(
      "[" +
      elapsedMs() +
      "ms] event3 input, value1: 1, value2: " +
      sliderValue +
      ", position: " +
      sliderValue,
      "event3"
    );

    demoState.eventLogRows.event3.push(lineEl);

    const timeoutId = setTimeout(() => {
      demoState.sliderDispatchTimeouts = demoState.sliderDispatchTimeouts.filter((pendingTimeoutId) => pendingTimeoutId !== timeoutId);

      if (!demoState.sliderMerger) {
        return;
      }

      demoState.sliderMerger.add("event3", 1, sliderValue);
      appendExistingLogLine(logEvent3El, lineEl);
    }, inputDelayMs);

    demoState.sliderDispatchTimeouts.push(timeoutId);
  }

  function createLogLine(text, eventName, extraClassName) {
    const lineEl = document.createElement("div");
    lineEl.className = "log-line";

    if (eventName) {
      lineEl.classList.add(eventName + "-color");
    }
    if (extraClassName) {
      lineEl.classList.add(extraClassName);
    }

    lineEl.textContent = text;
    return lineEl;
  }

  function appendLogLine(container, text, eventName, extraClassName) {
    container.appendChild(createLogLine(text, eventName, extraClassName));
    container.scrollTop = container.scrollHeight;
  }

  function markHandledEventRow(eventRows, eventLineIndex, eventName) {
    const targetRow = eventRows[eventLineIndex];

    if (targetRow) {
      targetRow.classList.add(eventName + "-color", "handler-marker");
    }
  }

  async function runTest() {
    clearLog(logEvent1El);
    clearLog(logEvent2El);
    clearLog(logEvent3El);
    clearLog(logResultEl);

    // Read and sanitize user inputs
    let event1Total = sanitizeNonNegativeInteger(event1CountInput.value);
    let event1DelayMs = sanitizeNonNegativeInteger(event1DelayInput.value);
    let event2Total = sanitizeNonNegativeInteger(event2CountInput.value);
    let event2DelayMs = sanitizeNonNegativeInteger(event2DelayInput.value);
    let event3Total = sanitizeNonNegativeInteger(event3CountInput.value);
    let event3DelayMs = sanitizeNonNegativeInteger(event3DelayInput.value);
    let testMinBufferTimeMs = sanitizeNonNegativeInteger(testMinBufferInput.value);
    let testMaxBufferTimeMs = sanitizeNonNegativeInteger(testMaxBufferInput.value);

    if (testMaxBufferTimeMs < testMinBufferTimeMs) testMaxBufferTimeMs = testMinBufferTimeMs;

    event1CountInput.value = event1Total;
    event1DelayInput.value = event1DelayMs;
    event2CountInput.value = event2Total;
    event2DelayInput.value = event2DelayMs;
    event3CountInput.value = event3Total;
    event3DelayInput.value = event3DelayMs;
    testMinBufferInput.value = testMinBufferTimeMs;
    testMaxBufferInput.value = testMaxBufferTimeMs;
    let start = new Date().getTime();

    resetDemoState(start);
    createEvent3SliderMerger(testMinBufferTimeMs, testMaxBufferTimeMs);

    const Merger = new EventMerger(function (eventName, _, lastValue2) {
      demoState.handledEventCount[eventName] += 1;
      demoState.handledEventCount[eventName] += this.queue.dup - 1;
      const markerIndex = demoState.handledEventCount[eventName];
      appendLogLine(
        logResultEl,
        "[" +
        Math.round(new Date().getTime() - start) +
        "ms] Handle: " +
        arguments[0] +
        ", dup: " +
        this.queue.dup +
        ", total value1 added: " +
        this.queue.stack +
        ", last value2: " +
        lastValue2,
        eventName
      );
      markHandledEventRow(demoState.eventLogRows[eventName], markerIndex - 1, eventName);
    }, testMinBufferTimeMs, testMaxBufferTimeMs);

    let event1_count = 0;
    let event2_count = 0;
    let event3_count = 0;

    start = new Date().getTime();
    demoState.start = start;

    // Event 1 - loop
    (async () => {
      while (event1_count++ < event1Total) {
        const random_number = Math.round(1000 * Math.random());
        const lineEl = createLogLine(
          "[" +
          Math.round(new Date().getTime() - start) +
          "ms] event1, value1: 10, value2: " +
          random_number +
          ", count: " +
          event1_count
        );

        demoState.eventLogRows.event1.push(lineEl);
        appendExistingLogLine(logEvent1El, lineEl);

        Merger.add("event1", 10, random_number);
        await wait(event1DelayMs);
      }
    })();

    // Event 2 - loop
    (async () => {
      while (event2_count++ < event2Total) {
        const random_number = Math.round(1000 * Math.random());
        const lineEl = createLogLine(
          "[" +
          Math.round(new Date().getTime() - start) +
          "ms] event2, value1: 10, value2: " +
          random_number +
          ", count: " +
          event2_count
        );

        demoState.eventLogRows.event2.push(lineEl);
        appendExistingLogLine(logEvent2El, lineEl);

        Merger.add("event2", 10, random_number);
        await wait(event2DelayMs);
      }
    })();

    // Event 3 - loop
    (async () => {
      while (event3_count++ < event3Total) {
        const random_number = Math.round(1000 * Math.random());
        const lineEl = createLogLine(
          "[" +
          Math.round(new Date().getTime() - start) +
          "ms] event3, value1: 10, value2: " +
          random_number +
          ", count: " +
          event3_count
        );

        demoState.eventLogRows.event3.push(lineEl);
        appendExistingLogLine(logEvent3El, lineEl);

        Merger.add("event3", 10, random_number);
        await wait(event3DelayMs);
      }
    })();

    // Wait for all events to be handled
    while (Object.keys(Merger.queue).length) {
      await wait(100);
    }
    // Wait a bit more to ensure all events are handled
    await wait(testMaxBufferTimeMs);
  }

  event3InputSlider.addEventListener("input", () => {
    const sliderValue = sanitizeNonNegativeInteger(event3InputSlider.value);
    const inputDelayMs = sanitizeNonNegativeInteger(event3DelayInput.value);
    const minBufferTimeMs = sanitizeNonNegativeInteger(testMinBufferInput.value);
    let maxBufferTimeMs = sanitizeNonNegativeInteger(testMaxBufferInput.value);

    if (maxBufferTimeMs < minBufferTimeMs) {
      maxBufferTimeMs = minBufferTimeMs;
      testMaxBufferInput.value = maxBufferTimeMs;
    }

    updateSliderValue(event3InputSlider, event3InputValueEl, sliderValue);

    if (!demoState.sliderMerger || demoState.sliderMerger.minBufferTimeMs !== minBufferTimeMs || demoState.sliderMerger.maxBufferTimeMs !== maxBufferTimeMs) {
      createEvent3SliderMerger(minBufferTimeMs, maxBufferTimeMs);
    }

    queueEvent3SliderInput(sliderValue, inputDelayMs);
  });

  document
    .getElementById("run-test")
    .addEventListener("click", () => {
      runTest();
    });

  (async () => {
    // wait until everything is ready to run the first test on load
    while (document.readyState !== "complete") {
      await wait(100);
    }
    runTest();
  })();
})();

window.addEventListener('load', () => {
  document.getElementById('test-min-buffer').value = 75;
  document.getElementById('test-max-buffer').value = 200;
  document.getElementById('event1-count').value = 10;
  document.getElementById('event1-delay').value = 50;
  document.getElementById('event2-count').value = 10;
  document.getElementById('event2-delay').value = 25;
  document.getElementById('event3-count').value = 1;
  document.getElementById('event3-delay').value = 25;
  document.getElementById('event3-input-slider').value = 0;
  document.getElementById('event3-output-slider').value = 0;
  document.getElementById('event3-input-value').textContent = 0;
  document.getElementById('event3-output-value').textContent = 0;

  document.getElementById('log-event1').replaceChildren();
  document.getElementById('log-event2').replaceChildren();
  document.getElementById('log-event3').replaceChildren();
  document.getElementById('log-result').replaceChildren();
});