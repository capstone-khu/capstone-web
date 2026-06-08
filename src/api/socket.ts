const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function frame(type: number, tsMs: number, jpegBytes: Uint8Array) {
    const headerSize = 1 + 8;

    const buffer = new ArrayBuffer(
        headerSize + jpegBytes.length
    );

    const view = new DataView(buffer);

    view.setUint8(0, type);

    view.setBigUint64(
        1,
        BigInt(tsMs),
        false
    );

    new Uint8Array(
        buffer,
        headerSize
    ).set(jpegBytes);

    return buffer;
}

export function sendVideoFrame(video: HTMLVideoElement, ws: WebSocket, t0:number) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

    // 현재 비디오 프레임 캡처
  ctx?.drawImage(video, 0, 0);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const jpegBytes = new Uint8Array(await blob.arrayBuffer());
    const tsMs = Date.now() - t0;
      const packet = frame(
            0x02,
            tsMs,
            jpegBytes
      );

      ws.send(packet);
      console.log('video frame sended: ', packet);
      
  }, 'image/jpeg', 0.8);
}

function floatToPCM16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));

    pcm[i] =
      s < 0
        ? Math.round(s * 0x8000)
        : Math.round(s * 0x7fff);
  }

  return pcm;
}

export async function sendAudioFrame(
  stream: MediaStream,
  ws: WebSocket,
  t0: number
) {
  const audioContext = new AudioContext({
    sampleRate: 48000,
  });

  const source =
    audioContext.createMediaStreamSource(stream);

  await audioContext.audioWorklet.addModule(
    '/audio-processor.js'
  );

  const workletNode =
    new AudioWorkletNode(
      audioContext,
      'pcm-processor'
    );

  source.connect(workletNode);

  let sampleBuffer: number[] = [];

  workletNode.port.onmessage = (event) => {
    const samples = event.data as Float32Array;

    sampleBuffer.push(...samples);

    while (sampleBuffer.length >= 4800) {
      const chunk = sampleBuffer.slice(0, 4800);

      sampleBuffer = sampleBuffer.slice(4800);

      const pcm16 = floatToPCM16(
        new Float32Array(chunk)
      );

      const pcmBytes = new Uint8Array(
        pcm16.buffer
      );

      const packet = frame(
        0x01,
        Date.now() - t0,
        pcmBytes
      );

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(packet);
        console.log('audio message sended: ', packet)
      }
    }
  };

  return {
    audioContext,
    workletNode,
  };
}