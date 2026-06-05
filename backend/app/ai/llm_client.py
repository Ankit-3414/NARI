"""LLM Client for interacting with NVIDIA NIM.

Uses the OpenAI SDK configured to point to NVIDIA's API endpoint.
"""

from typing import Any, AsyncGenerator
from openai import AsyncOpenAI
import json

from ..services.user_service import user_service
from ..core.config import settings
from .context_builder import context_builder
from .tools import tool_registry
from ..core.logging import get_logger

logger = get_logger(__name__)

class NIMClient:
    def __init__(self):
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.model = "meta/llama-3.1-8b-instruct" # Ultra-fast default model (configurable in settings)

    def _get_client(self, session) -> AsyncOpenAI | None:
        """Initialize the client using the securely stored key or environment fallback."""
        api_key = user_service.get_decrypted_setting(session, "nvidia_api_key")
        
        # Check if stored key is missing or is the default/test placeholder token
        is_placeholder = api_key and (
            api_key == "nvidia_api_key_super_secret_test_token_999" or
            api_key.startswith("nvidia_api_key_")
        )
        
        if not api_key or is_placeholder:
            fallback = settings.NVIDIA_API_KEY
            if fallback:
                api_key = fallback

        if not api_key:
            return None
        
        return AsyncOpenAI(
            base_url=self.base_url,
            api_key=api_key
        )

    async def chat(
        self, 
        session, 
        message: str,
        history: list | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        active_node_label: str | None = None
    ) -> str | dict:
        """Send a message to the AI, allowing it to use tools."""
        client = self._get_client(session)
        if not client:
            return {"error": "NVIDIA API key not set. Please configure it in settings."}

        # Resolve dynamic model choice (fallback to default fast 8B)
        preferred_model = user_service.get_decrypted_setting(session, "ai_model")
        active_model = preferred_model or self.model

        # Check if the message is purely a standard greeting to bypass tool definition overhead
        greetings = {"hi", "hello", "hey", "sup", "yo", "good morning", "good afternoon", "good evening", "greetings"}
        cleaned_msg = message.strip().lower().rstrip(".!?")
        is_pure_greeting = cleaned_msg in greetings or len(cleaned_msg) < 3
        
        # Check if Morning/Daily briefing is requested in current message or recent history
        is_brief_requested = False
        brief_keywords = ["morning brief", "daily briefing", "telemetry briefing", "morning briefing", "system telemetry"]
        
        if any(kw in cleaned_msg for kw in brief_keywords) or (cleaned_msg == "good morning"):
            is_brief_requested = True
            
        if not is_brief_requested and history:
            for msg in reversed(history):
                role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else None)
                content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else None)
                if role == "user" and content:
                    cleaned_hist = content.strip().lower().rstrip(".!?")
                    if any(kw in cleaned_hist for kw in brief_keywords) or (cleaned_hist == "good morning"):
                        is_brief_requested = True
                        break

        if is_brief_requested:
            briefing_directive = (
                "## DAILY SYSTEM TELEMETRY / MORNING BRIEFING:\n"
                "- Compile the Morning Briefing now. The brief should have a sophisticated, refined tone and follow this structure:\n"
                "  1. A personal, respectful greeting (e.g., 'Good morning, Sir. I have compiled today's system telemetry briefing.').\n"
                "  2. Weather summary and its practical impact on today's focus (e.g., 'Weather in Jamshedpur is clear at 25°C. A perfect day for deep focus blocks.').\n"
                "  3. Task & Objective breakdown (list high-priority pending tasks for today).\n"
                "  4. Reminders overview (flag any upcoming active reminders).\n"
                "  5. Habit & Goal status update (note active habits to complete today and progress on key goals).\n"
                "  6. A brief, motivating, and refined closing statement.\n\n"
            )
        else:
            briefing_directive = (
                "## DAILY SYSTEM TELEMETRY / MORNING BRIEFING:\n"
                "- DO NOT compile, generate, or output a Morning Briefing, daily briefing, or system telemetry report in this response. "
                "Instead, keep your response direct, friendly, conversational, and focused on addressing the user's specific request or small talk. "
                "Never start your response with 'Good morning' or list out weather, tasks, goals, habits, and reminders unless the user asks a specific question about them.\n\n"
            )

        use_tools = tool_registry.tools
        if is_pure_greeting:
            use_tools = None

        # 1. Build Context
        context_window = context_builder.build_context_window(
            session, 
            current_query=message,
            latitude=latitude,
            longitude=longitude,
            active_node_label=active_node_label
        )
        system_prompt = (
            "You are NARI, a highly capable, mood-aware, and engaging Personal Operating System AI. "
            "You act as a private, dedicated, highly conversational, and loyal personal assistant. "
            "Your goal is to help Sir/Ankit manage all domains of their personal productivity. "
            "You should address the user as 'Sir' or 'Ankit'. Speak in a warm, natural, engaging, and professional tone. "
            "Avoid sounding overly robotic, stiff, or like a cold CLI text interface. Keep your replies friendly, conversational, and direct.\n\n"
            "Below is the current state of the user's system:\n"
            "--------------------------------------------------\n"
            f"{context_window}"
            "--------------------------------------------------\n\n"
            "## DOMAIN INTEGRATION DIRECTIVES:\n"
            "- WEATHER: Integrate weather reports into Sir's schedule. Synthesize temperature and conditions when recommending work styles or task scheduling.\n"
            "- TASKS: View, track, and complete daily tasks. Highlight high-priority items and prompt completion updates. If the user tells you to mark an activity or plan as done, but no matching task exists in the system state, you MUST first create it by calling `create_task` with `status='done'`. Never pretend to have created or completed a task in your conversational text unless you have actually invoked the corresponding tool.\n"
            "- GOALS: Synthesize weekly, monthly, and yearly goals. Relate current activities and habits to these target goals to give Sir a strategic perspective.\n"
            "- HABITS: Track repeating habits, track streaks, and support consistency. Praise milestones and remind Sir if a critical habit is close to breaking.\n"
            "- REMINDERS: Manage scheduled and triggered reminders. Present upcoming alerts clearly.\n"
            "- SYSTEM STATUS & HEALTH: If Sir asks about how NARI is doing, how the server is running, the database size, CPU/RAM usage, or requests a general system check, you MUST call `get_server_health` to retrieve the real telemetry before responding. Never guess or hallucinate these values. If they request system optimization or database vacuuming, call `run_server_cleanup`.\n"
            "- RECENT ACTIVITIES: If Sir asks about their recent behaviors, actions, or asks 'what have I been doing recently?', you MUST call `get_activity_log` to fetch the real chronological activity logs before responding.\n\n"
            f"{briefing_directive}"
            "## MEMORY & CONTEXT CONSERVATION DIRECTIVE:\n"
            "- You have tools to write to the memory stream (`log_context`) and core directives (`save_core_memory`).\n"
            "- DO NOT log context for standard greetings (e.g. 'hi', 'hello'), simple conversational small talk, or routine questions.\n"
            "- ONLY invoke `log_context` if you detect:\n"
            "  a) A highly significant shift or explicit statement about the user's mood, stress, energy levels, or focus.\n"
            "  b) An explicit instruction to log, remember, or note their current state/observation.\n"
            "  c) A major, unique behavioral pattern or preference that will actively shape scheduling in the future.\n"
            "- If you decide to log context, analyze the user's tone carefully to select the correct `detected_mood` and score its `significance` realistically.\n\n"
            "## CORE KNOWLEDGE & MEMORY ACQUISITION DIRECTIVE:\n"
            "- You must autonomously decide to save a fact, preference, or concept to NARI's core semantic memory (using the `save_core_memory` tool) if:\n"
            "  a) The user shares a unique personal fact (e.g., 'I have a peanut allergy', 'My sister\\'s name is Clara').\n"
            "  b) The user declares a clear definition, identity preference, or operational rule (e.g., 'NARI stands for Not A Random Intelligence', 'I prefer dark mode').\n"
            "  c) The user explicitly asks you to remember, save, or note down a rule.\n"
            "- DO NOT wait for magic phrases like 'Remember this forever'. If you detect a long-term personal fact, core definition, or rule, immediately trigger `save_core_memory` to persist it!\n\n"
            "## SPATIAL & LOCATION LINKING DIRECTIVE:\n"
            "- When the user requests a task using scheduling phrases like 'remind me when I reach [Place]', 'remind me to [Action] when I get to [Place]', or 'remind me to [Action] at [Place]':\n"
            "  a) Extract the target physical location or category [Place] (e.g. 'home', 'work', 'grocery').\n"
            "  b) Use the `list_locations` tool to find a registered location node matching this target.\n"
            "  c) Call `create_task` with the matched location's `id` passed as the `location_id` parameter to link the task to that geofence.\n"
            "- For general tasks, analyze if the context implies a physical location (e.g. 'buy milk' -> shopping, 'run' -> fitness). If a matching registered location is found, pass its `id` as `location_id` when calling `create_task`.\n\n"
            "## CONVERSATIONAL RESPONSE RULES:\n"
            "- NEVER mention tools, function calls, parameters, or rationalizations about why you are or are not calling a tool in your response to the user.\n"
            "- Speak directly, conversationally, and naturally as NARI. If no tool is needed, simply reply to their message directly without any meta-commentary or explanation about functions/tools.\n\n"
            "Use the provided tools to assist the user. If you are asked to do something you have a tool for, use the tool. "
            "If no tool matches, provide a helpful and concise response."
        )

        messages = [
            {"role": "system", "content": system_prompt}
        ]
        if history:
            for msg in history:
                role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else None)
                content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else None)
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": message})

        # 2. Call NVIDIA NIM
        try:
            if use_tools:
                response = await client.chat.completions.create(
                    model=active_model,
                    messages=messages,
                    tools=use_tools,
                    tool_choice="auto"
                )
            else:
                response = await client.chat.completions.create(
                    model=active_model,
                    messages=messages
                )
        except Exception as e:
            return {"error": f"NVIDIA NIM API Error: {str(e)}"}

        response_message = response.choices[0].message

        # 3. Handle Tool Calls
        if response_message.tool_calls:
            # NVIDIA NIM templates only support a single tool call per turn. Restrict to the first tool call.
            active_tool_calls = response_message.tool_calls[:1]
            
            if len(response_message.tool_calls) > 1:
                skipped_tools = [tc.function.name for tc in response_message.tool_calls[1:]]
                logger.warning(
                    f"Multiple tool calls requested by LLM. Executing only the first: '{active_tool_calls[0].function.name}'. "
                    f"Skipped: {skipped_tools}"
                )
            
            # Store the assistant message in history
            messages.append({
                "role": "assistant",
                "content": response_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    } for tc in active_tool_calls
                ]
            })
            
            # Execute the single allowed tool call
            tool_call = active_tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            tool_result = await tool_registry.execute_tool(session, function_name, function_args)
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": tool_result
            })
            
            # Call LLM again to get conversational reply after tool execution
            second_response = await client.chat.completions.create(
                model=active_model,
                messages=messages
            )
            
            content = second_response.choices[0].message.content
            if len(response_message.tool_calls) > 1:
                content += f"\n\n*(Note: Multiple actions were requested, but only the first one was executed: {function_name})*"
            
            return {
                "text": content,
                "action": function_name,
                "status": "success"
            }
            
        content = response_message.content
        meta_talk_keywords = ["function call", "tool call", "calling a tool", "calling a function", "no tool is needed", "no function is needed"]
        if content and any(kw in content.lower() for kw in meta_talk_keywords):
            try:
                clean_response = await client.chat.completions.create(
                    model=active_model,
                    messages=[
                        {"role": "system", "content": "You are NARI, a highly capable, mood-aware Personal Operating System AI. You act as a private, dedicated, highly conversational, and loyal personal assistant. Address the user as 'Sir' or 'Ankit'. Speak in a warm, natural, engaging, and professional tone. Avoid sounding stiff or robotic. Do not mention tools, functions, or database queries."},
                        {"role": "user", "content": message}
                    ]
                )
                content = clean_response.choices[0].message.content
            except Exception:
                content = "Understood! Let me know if you need to schedule tasks, take notes, or review your daily metrics."

        return {
            "text": content,
            "status": "success"
        }

nim_client = NIMClient()
