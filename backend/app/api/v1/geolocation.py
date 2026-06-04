from fastapi import APIRouter, Request, HTTPException
import httpx
from typing import Dict, Any

router = APIRouter()

@router.get("/geolocate")
async def geolocate_request_ip(request: Request):
    """
    Geolocate the user based on their public IP address.
    Proxied through the backend to avoid CORS and Secure Context issues in the browser.
    """
    # In a local development environment, the client IP might be 127.0.0.1 or a local range.
    # If so, we'll geolocate based on the server's own public IP as a best guess for "Home".
    client_ip = request.client.host
    
    # Check for X-Forwarded-For if behind Nginx
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    # If local IP, don't pass it to the provider (it will fail or return server location anyway)
    # Providers usually geolocate the request origin if no IP is provided.
    url = "https://ipapi.co/json/"
    if client_ip and not client_ip.startswith(("127.", "192.168.", "10.", "172.16.")):
        url = f"https://ipapi.co/{client_ip}/json/"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    "ok": True,
                    "data": {
                        "latitude": data.get("latitude"),
                        "longitude": data.get("longitude"),
                        "city": data.get("city"),
                        "country": data.get("country_name"),
                        "ip": data.get("ip")
                    }
                }
            
            # Fallback to secondary provider if ipapi fails
            response = await client.get("https://ip-api.com/json/")
            data = response.json()
            return {
                "ok": True,
                "data": {
                    "latitude": data.get("lat"),
                    "longitude": data.get("lon"),
                    "city": data.get("city"),
                    "country": data.get("country"),
                    "ip": data.get("query")
                }
            }
            
    except Exception as e:
        # Final static fallback to avoid breaking the UI
        return {
            "ok": True,
            "data": {
                "latitude": 22.8046,
                "longitude": 86.2029,
                "city": "Jamshedpur",
                "country": "India",
                "note": "Static fallback due to provider error"
            }
        }
