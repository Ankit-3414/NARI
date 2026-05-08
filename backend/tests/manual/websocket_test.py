import asyncio
import websockets
import json

async def listen():
    uri = "ws://localhost:8000/ws?token=nari_sk_v3_9xQ2pLmN7_F0cus"
    async with websockets.connect(uri) as websocket:
        while True:
            try:
                message = await websocket.recv()
                data = json.loads(message)
                print(f"Received message: {data}")
            except websockets.ConnectionClosed:
                print("Connection closed")
                break

if __name__ == "__main__":
    asyncio.run(listen())
