import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws?token=nari_sk_v3_9xQ2pLmN7_F0cus"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WS. Waiting for events...")
            while True:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    print(f"Received Event: {json.loads(message)}")
                except asyncio.TimeoutError:
                    print("Still waiting...")
                except websockets.exceptions.ConnectionClosed:
                    print("Connection closed")
                    break
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
