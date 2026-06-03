"""Tool Registry for NARI AI.

Defines the capabilities available to the LLM in OpenAI function calling format.
"""

from typing import Any, Callable
from sqlmodel import Session
import json
import httpx
import re

from ..services.task_service import task_service
from ..services.activity_service import activity_service
from ..services.note_service import note_service
from ..schemas.task import TaskCreate
from ..core.constants import EntityType, TaskPriority
from ..services.semantic_memory import semantic_memory
from ..utils.weather import fetch_weather_report
from ..utils.web_search import perform_web_search

class ToolRegistry:
    def __init__(self):
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "create_task",
                    "description": "Create a new task for the user.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The title or main description of the task."
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "normal", "high", "urgent"],
                                "description": "The priority of the task."
                            },
                            "location_id": {
                                "type": "integer",
                                "description": "Optional ID of a saved physical location (e.g. Home, Gym) to link this task to."
                            }
                        },
                        "required": ["title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as completed.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "The ID of the task to complete."
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "log_context",
                    "description": "Log a highly significant user preference, emotional state, or context observation. DO NOT call for standard greetings, small talk, or routine queries.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "observation": {
                                "type": "string",
                                "description": "The specific behavioral insight, user state, or preference observation."
                            },
                            "detected_mood": {
                                "type": "string",
                                "enum": ["focused", "stressed", "fatigued", "motivated", "calm", "neutral"],
                                "description": "The current detected mood or cognitive state of the user based on their tone and message."
                            },
                            "significance": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 5,
                                "description": "The significance level of this observation for future productivity and behavior adaptation (1 = low, 5 = critical)."
                            }
                        },
                        "required": ["observation", "detected_mood", "significance"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_memory",
                    "description": "Search the user's past behavioral history and notes using semantic keywords.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query (e.g. 'learning python', 'math notes')."
                            },
                            "target": {
                                "type": "string",
                                "enum": ["activity", "notes"],
                                "description": "Whether to search past activity logs or full markdown notes."
                            }
                        },
                        "required": ["query", "target"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "save_core_memory",
                    "description": "Save a permanent fact, preference, or learned concept into NARI's core semantic memory.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "concept": {
                                "type": "string",
                                "description": "The core topic or concept name (e.g. 'User Diet', 'Python Async')."
                            },
                            "summary": {
                                "type": "string",
                                "description": "A concise summary of what was learned or the rule to follow."
                            }
                        },
                        "required": ["concept", "summary"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Search the live web for real-time news, documentation, weather, coding help, or general public knowledge.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query (e.g. 'FastAPI background tasks', 'weather in New Delhi today')."
                            }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get the current weather and 3-day forecast for a city or geographical location in the world.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The name of the city, region, or location (e.g., 'Jamshedpur', 'New Delhi', 'Paris')."
                            }
                        },
                        "required": ["location"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_locations",
                    "description": "Retrieve the list of saved physical locations (e.g. Home, Gym, Office) including their coordinates and geofenced radiuses.",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_location",
                    "description": "Register and save a new physical location node with coordinates and geofenced radius.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "label": {
                                "type": "string",
                                "description": "Name or identifier of the location (e.g. 'Gym', 'Market', 'Work')."
                            },
                            "latitude": {
                                "type": "number",
                                "description": "Latitude coordinate."
                            },
                            "longitude": {
                                "type": "number",
                                "description": "Longitude coordinate."
                            },
                            "category": {
                                "type": "string",
                                "enum": ["home", "shopping", "fitness", "work", "study", "general"],
                                "description": "The category classification."
                            },
                            "radius_meters": {
                                "type": "number",
                                "description": "Geofence boundary radius in meters (default 100)."
                            },
                            "name": {
                                "type": "string",
                                "description": "Optional description or street address."
                            }
                        },
                        "required": ["label", "latitude", "longitude"]
                    }
                }
            }
        ]

    async def execute_tool(self, session: Session, name: str, arguments: dict[str, Any]) -> str:
        """Execute a tool by name and return its result as a string."""
        try:
            if name == "create_task":
                # Ensure priority is valid
                priority = arguments.get("priority", "normal")
                try:
                    priority = TaskPriority(priority)
                except ValueError:
                    priority = TaskPriority.NORMAL
                
                payload = TaskCreate(
                    title=arguments["title"],
                    priority=priority,
                    location_id=arguments.get("location_id")
                )
                task = await task_service.create(session, payload)
                feedback = f"Task created successfully with ID {task.id}."
                if task.location_id:
                    from ..services.location_service import location_service
                    loc = location_service.get(session, task.location_id)
                    if loc:
                        feedback += f" Linked to location: {loc.label}."
                return feedback
                
            elif name == "complete_task":
                task_id = arguments["task_id"]
                await task_service.complete(session, task_id)
                return f"Task {task_id} completed successfully."
                
            elif name == "log_context":
                observation = arguments["observation"]
                detected_mood = arguments["detected_mood"]
                significance = arguments["significance"]
                
                activity_service.create(
                    session,
                    entity_type=EntityType.CONTEXT,
                    action="logged",
                    message=f"Behavioral context logged (Mood: {detected_mood.upper()}, Significance: {significance}/5)",
                    entity_id=0, # Context entries don't have a parent entity yet
                    payload={
                        "observation": observation,
                        "detected_mood": detected_mood,
                        "significance": significance
                    },
                    source="ai_agent"
                )
                return f"Successfully logged behavioral context with mood: {detected_mood}."
                
            elif name == "search_memory":
                target = arguments["target"]
                query = arguments["query"]
                
                if target == "activity":
                    results = activity_service.search(session, query, limit=5)
                    if not results:
                        return "No matching activity found."
                    formatted = "\n".join([f"- [{r.created_at.strftime('%Y-%m-%d')}] {r.message}" for r in results if not r.is_encrypted])
                    return f"Search Results (Activity):\n{formatted}"
                else:
                    results = note_service.search(session, query, limit=3)
                    if not results:
                        return "No matching notes found."
                    formatted = "\n".join([f"- [Note {r.id}: {r.title}] {r.content_markdown[:100]}..." for r in results])
                    return f"Search Results (Notes):\n{formatted}"

            elif name == "save_core_memory":
                concept = arguments["concept"]
                summary = arguments["summary"]
                semantic_memory.store_knowledge(session, concept, summary, source="agent_interaction")
                return f"Core memory saved for concept: {concept}"

            elif name == "web_search":
                 query = arguments["query"]
                 return await perform_web_search(query)
                
            elif name == "get_weather":
                location = arguments.get("location")
                
                # Try to enhance accuracy using stored user coordinates if available
                from ..services.user_service import user_service
                user = user_service.get_default_user(session)
                lat, lon = None, None
                
                if user.preferences_json:
                    try:
                        prefs = json.loads(user.preferences_json)
                        # If no location provided, or it matches the user's city, use high-precision coords
                        stored_city = prefs.get("weather_city", "").lower()
                        if not location or location.lower() == "current" or location.lower() == "here" or (stored_city and stored_city in location.lower()):
                            lat = prefs.get("weather_lat")
                            lon = prefs.get("weather_lon")
                            # If we use coords, we can still use the stored city name for the report
                            if not location or location.lower() in ["current", "here"]:
                                location = prefs.get("weather_city")
                    except Exception:
                        pass
                
                return await fetch_weather_report(location, lat=lat, lon=lon)

            elif name == "list_locations":
                from ..services.location_service import location_service
                locations = await location_service.list(session, include_archived=False)
                if not locations:
                    return "No saved locations found."
                formatted = "\n".join([
                    f"- [{loc.category.upper()}] {loc.label}: Lat {loc.latitude}, Lng {loc.longitude} (Radius: {loc.radius_meters}m)"
                    for loc in locations
                ])
                return f"Saved Locations:\n{formatted}"

            elif name == "create_location":
                from ..services.location_service import location_service
                from ..schemas.location import LocationCreate
                
                payload = LocationCreate(
                    label=arguments["label"],
                    latitude=arguments["latitude"],
                    longitude=arguments["longitude"],
                    category=arguments.get("category", "general"),
                    radius_meters=arguments.get("radius_meters", 100.0),
                    name=arguments.get("name")
                )
                loc = await location_service.create_location(session, payload)
                return f"Successfully registered new location '{loc.label}' with ID {loc.id}."
                    
            else:
                return f"Error: Tool '{name}' is not recognized."
                
        except Exception as e:
            print(f"TOOL EXECUTION ERROR: {e}")
            return f"Error executing tool '{name}': {str(e)}"



tool_registry = ToolRegistry()
