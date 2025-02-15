# file: ws_audio_server_stt.py

import asyncio
import websockets
import pyaudio
import numpy as np
import librosa  # for resampling, pip install librosa
from RealtimeSTT import AudioToTextRecorder

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2           # Our PyAudio stream is stereo
RATE = 44100           # Our PyAudio stream is 44.1 kHz

class AudioServerSTT:
    def __init__(self):
        self.clients = set()

        self.p = pyaudio.PyAudio()

        # (1) Open input device (virtual cable capturing Google Meet).
        self.stream_in = self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )

        # (2) For demonstration, we also open an output device
        #     If you want to hear what’s being captured locally:
        self.stream_out = self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            output=True,
            frames_per_buffer=CHUNK
        )

        # (3) Create RealtimeSTT recorder with no microphone usage,
        #     since we’ll feed it audio manually.
        self.stt_recorder = AudioToTextRecorder(
            use_microphone=False,
            enable_realtime_transcription=True,
            realtime_model_type="tiny",  # or "base" or "medium"
            language="en",               # adjust for your language
            device="cuda",              # or "cpu" if no GPU
        )

    async def handler(self, websocket):
        # Add client to our set
        self.clients.add(websocket)
        print(f"[WebSocket] Client connected: {websocket.remote_address}")

        try:
            async for message in websocket:
                # (A) This message is inbound audio from the client
                #     We can write it to output device, or feed it to STT, etc.
                self.stream_out.write(message)
        except websockets.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            print(f"[WebSocket] Client disconnected: {websocket.remote_address}")

    async def broadcast_audio(self):
        print("[AudioServerSTT] Broadcasting audio + feeding STT...")
        while True:
            # (B) Read from the local input device (Meet audio).
            raw_data = self.stream_in.read(CHUNK, exception_on_overflow=False)

            # 1) Send to all WebSocket clients
            to_remove = []
            for ws in self.clients:
                try:
                    await ws.send(raw_data)
                except websockets.ConnectionClosed:
                    to_remove.append(ws)
            for ws in to_remove:
                self.clients.remove(ws)

            # 2) Optionally play locally
            self.stream_out.write(raw_data)

            # 3) Feed into RealtimeSTT
            #    But first downmix/resample from 44.1 kHz stereo -> 16 kHz mono
            audio_16k_mono = self.downmix_and_resample(raw_data)
            #    Then feed it
            self.stt_recorder.feed_audio(audio_16k_mono)

            # 4) Check if there's new text
            text_output = self.stt_recorder.text()  # blocking or callback-based
            if text_output:
                print("[STT]", text_output)  # or do something with it

            await asyncio.sleep(0)  # yield to event loop

    def downmix_and_resample(self, raw_data):
        # Convert bytes to numpy int16 array
        samples = np.frombuffer(raw_data, dtype=np.int16)

        # Reshape for stereo: shape = (CHUNK, 2)
        samples = samples.reshape(-1, CHANNELS)

        # Convert to float32 in range [-1,1], because librosa likes float
        float_data = samples.astype(np.float32) / 32768.0

        # Downmix to mono: mean of left/right channels
        mono_data = float_data.mean(axis=1)

        # Now resample from 44100 -> 16000
        mono_16k = librosa.resample(y=mono_data, orig_sr=RATE, target_sr=16000)

        # Convert back to int16 PCM
        int16_16k = (mono_16k * 32767.0).astype(np.int16)

        return int16_16k.tobytes()

    async def run_server(self, host="0.0.0.0", port=8765):
        async with websockets.serve(self.handler, host, port):
            await self.broadcast_audio()

async def main():
    # Protect with if __name__ == '__main__' on Windows
    server = AudioServerSTT()
    await server.run_server()

if __name__ == "__main__":
    import sys
    if sys.platform.startswith("win"):
        # Windows requires 'if __name__ == "__main__":' for multiprocessing
        # but we do a quick check here:
        pass

    asyncio.run(main())
