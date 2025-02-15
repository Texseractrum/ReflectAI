# file: ws_audio_client.py

import asyncio
import websockets
import pyaudio

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 64
RATE = 44100


async def client_audio_loop(uri):
    p = pyaudio.PyAudio()

    # Input from local mic
    stream_in = p.open(format=FORMAT,
                       channels=CHANNELS,
                       rate=RATE,
                       input=True,
                       frames_per_buffer=CHUNK)

    # Output to local speaker
    stream_out = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        output=True,
                        frames_per_buffer=CHUNK)

    async with websockets.connect(uri) as ws:
        print("[Client] Connected to server.")

        # We'll have two tasks:
        # 1) Reading from server -> playing
        # 2) Reading from mic -> sending to server

        async def send_audio():
            while True:
                data = stream_in.read(CHUNK, exception_on_overflow=False)
                await ws.send(data)
                await asyncio.sleep(0)

        async def receive_audio():
            async for message in ws:
                # message is raw audio from the server
                stream_out.write(message)

        # run both tasks concurrently
        send_task = asyncio.create_task(send_audio())
        recv_task = asyncio.create_task(receive_audio())

        done, pending = await asyncio.wait(
            [send_task, recv_task],
            return_when=asyncio.FIRST_EXCEPTION
        )

        for task in pending:
            task.cancel()

    # Cleanup
    stream_in.stop_stream()
    stream_in.close()
    stream_out.stop_stream()
    stream_out.close()
    p.terminate()
    print("[Client] Disconnected.")


if __name__ == "__main__":
    asyncio.run(client_audio_loop("ws://127.0.0.1:8765"))
