class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];

    if (input.length > 0) {
      const channel = input[0];

      this.port.postMessage(channel);
    }

    return true;
  }
}

registerProcessor(
  'pcm-processor',
  PCMProcessor
);