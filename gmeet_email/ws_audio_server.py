# file: ws_audio_server.py

import asyncio
import websockets
import pyaudio

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100

class AudioServer:
    def __init__(self):
        self.clients = set()

        self.p = pyaudio.PyAudio()

        # We'll read from the default input (the virtual cable device).
        self.stream_in = self.p.open(format=FORMAT,
                                     channels=CHANNELS,
                                     rate=RATE,
                                     input=True,
                                     frames_per_buffer=CHUNK)

        # We'll write to the default output (could also be the same virtual cable if you want 2-way).
        self.stream_out = self.p.open(format=FORMAT,
                                      channels=CHANNELS,
                                      rate=RATE,
                                      output=True,
                                      frames_per_buffer=CHUNK)

    async def handler(self, websocket):
        # A new client connected
        self.clients.add(websocket)
        print(f"[WebSocket] Client connected: {websocket.remote_address}")
        try:
            # Start listening for incoming audio from this client
            async for message in websocket:
                # Each message is raw audio data from the client
                self.stream_out.write(message)
        except websockets.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            print(f"[WebSocket] Client disconnected: {websocket.remote_address}")

    async def broadcast_audio(self):
        """
        Continuously read from self.stream_in and send to all connected clients.
        """
        print("[AudioServer] Broadcasting audio to clients...")
        while True:
            data = self.stream_in.read(CHUNK, exception_on_overflow=False)
            # Send to all websockets
            to_remove = []
            for ws in self.clients:
                try:
                    await ws.send(data)
                except websockets.ConnectionClosed:
                    to_remove.append(ws)
            for ws in to_remove:
                self.clients.remove(ws)
            await asyncio.sleep(0)  # yield to event loop

    async def run_server(self, host="0.0.0.0", port=8765):
        # Launch a websockets server
        async with websockets.serve(self.handler, host, port):
            # Run the broadcast coroutine in parallel
            await self.broadcast_audio()


async def main():
    server = AudioServer()
    await server.run_server()

if __name__ == "__main__":
    asyncio.run(main())
