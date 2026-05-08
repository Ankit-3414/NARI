import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws?token=nari_sk_v3_9xQ2pLmN7_F0cus"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WS")
            # The server might send a welcome message or we can just wait a bit
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received: {message}")
            except asyncio.TimeoutError:
                print("No message received (timeout), but connected.")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
