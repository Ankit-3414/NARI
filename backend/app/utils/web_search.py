"""Web search and online research reasoning utility for NARI.

Operates keyless and container-free:
1. Performs search via DuckDuckGo (HTML / Lite / API) with recency detection and time filters.
2. Intelligent URL scoring prioritizing deep article permalinks over generic category/homepages.
3. Fetches full page content in clean markdown via Jina Reader (r.jina.ai).
4. Synthesizes and reasons over the findings using NARI's cognitive LLM (LLaMA 3.2 11B / DeepSeek v4.1).
"""

import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import unquote, urlparse, parse_qs
import re
import html
import httpx

from ..core.logging import get_logger

logger = get_logger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class WebSearchError(Exception):
    """Custom exception for web search errors."""
    pass


class WebResearchEngine:
    """Keyless, container-free web search and reasoning engine."""

    def __init__(self, max_search_results: int = 6, max_pages_to_scrape: int = 3):
        self.max_search_results = max_search_results
        self.max_pages_to_scrape = max_pages_to_scrape

    def _preprocess_query(self, query: str) -> tuple[str, Optional[str]]:
        """
        Clean conversational query and detect recency intent for DuckDuckGo time filters.
        Returns: (optimized_query, df_filter)
        where df_filter can be 'd' (day), 'w' (week), 'm' (month), or None.
        """
        raw = query.strip()
        lower = raw.lower()

        # 1. Detect time-sensitivity intent
        df: Optional[str] = None
        if re.search(r"\b(today|past\s+24\s*hours?|last\s+24\s*hours?|past\s+day)\b", lower):
            df = "d"
        elif re.search(r"\b(this\s+week|past\s+week|last\s+week|past\s+7\s*days?|weekly)\b", lower):
            df = "w"
        elif re.search(r"\b(this\s+month|past\s+month|last\s+month|recently?|latest|newest|breakthroughs?|developments?)\b", lower):
            df = "m"

        # 2. Strip conversational query prefixes and filler words
        cleaned = re.sub(
            r"^(?:what\s+(?:are\s+the|is\s+the|are|is)|tell\s+me\s+about|can\s+you\s+(?:find|tell\s+me\s+about|search\s+for)|give\s+me\s+(?:the\s+)?(?:latest\s+)?(?:news|updates?|information)\s+on|search\s+(?:for)?|look\s+up)\s+",
            "",
            raw,
            flags=re.IGNORECASE,
        ).strip()

        # Remove trailing question marks and punctuation
        cleaned = re.sub(r"[\?\.\!]+$", "", cleaned).strip()

        # If time-sensitive and query lacks "news/developments", append "news" to reinforce recency
        if df and not re.search(r"\b(news|updates?|developments?)\b", cleaned, re.IGNORECASE):
            cleaned = f"{cleaned} news"

        return cleaned if cleaned else raw, df

    def _score_url(self, url: str) -> int:
        """Score candidate URLs to prioritize deep news/article permalinks over homepages/categories."""
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc.lower()
            path = parsed.path.strip("/")

            # Penalize blocked or non-article platforms
            blocked_domains = {
                "twitter.com", "x.com", "instagram.com", "facebook.com",
                "linkedin.com", "youtube.com", "tiktok.com", "reddit.com"
            }
            if any(b in netloc for b in blocked_domains):
                return -100

            # Penalize root domain homepages (e.g. https://cultamu.com/)
            if not path or path == "":
                return -50

            # Penalize generic category, tag, or archive listing hubs
            if re.search(r"^(category|categories|tag|tags|topics|archive|archives|page|feed|login|signup)(/.*)?$", path, re.I):
                return -30

            score = 10
            # Reward deep paths with article slugs (slug has words/hyphens or dates)
            if "/" in path:
                score += 20
            if re.search(r"\b202[4-9]\b", path):  # recent year
                score += 35
            if "-" in path or "_" in path:
                score += 25

            # Bonus for established robotics & tech news authorities
            authoritative_domains = {
                "theverge.com", "techcrunch.com", "wired.com", "reuters.com", "bloomberg.com",
                "therobotreport.com", "spectrum.ieee.org", "arstechnica.com", "venturebeat.com",
                "technologyreview.com", "engadget.com", "nature.com", "sciencedaily.com",
                "bbc.com", "apnews.com", "forbes.com", "zdnet.com", "ieee.org"
            }
            if any(dom in netloc for dom in authoritative_domains):
                score += 30

            return score
        except Exception:
            return 0

    async def search(self, query: str) -> List[Dict[str, str]]:
        """Search DuckDuckGo with query preprocessing and fallback mechanisms."""
        if not query or not query.strip():
            raise WebSearchError("Search query cannot be empty")

        clean_query, df_filter = self._preprocess_query(query)
        logger.info(f"Web search: query='{clean_query}' (raw='{query}'), time_filter='{df_filter}'")
        results: List[Dict[str, str]] = []

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://duckduckgo.com/",
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            # 1. Try DuckDuckGo HTML endpoint with time-filter if available
            try:
                payload = {"q": clean_query, "b": ""}
                if df_filter:
                    payload["df"] = df_filter
                resp = await client.post("https://html.duckduckgo.com/html/", data=payload)
                if resp.status_code == 200:
                    results = self._parse_ddg_html(resp.text)

                # If time filter yielded 0 results, retry HTML search without time filter
                if not results and df_filter:
                    resp = await client.post("https://html.duckduckgo.com/html/", data={"q": clean_query, "b": ""})
                    if resp.status_code == 200:
                        results = self._parse_ddg_html(resp.text)
            except Exception as e:
                logger.warning(f"DDG HTML search failed: {e}")

            # 2. Fallback to DuckDuckGo Lite endpoint if needed
            if not results:
                try:
                    lite_payload = {"q": clean_query}
                    if df_filter:
                        lite_payload["df"] = df_filter
                    resp = await client.post("https://lite.duckduckgo.com/lite/", data=lite_payload)
                    if resp.status_code == 200:
                        results = self._parse_ddg_lite(resp.text)
                    if not results and df_filter:
                        resp = await client.post("https://lite.duckduckgo.com/lite/", data={"q": clean_query})
                        if resp.status_code == 200:
                            results = self._parse_ddg_lite(resp.text)
                except Exception as e:
                    logger.warning(f"DDG Lite search failed: {e}")

            # 3. Fallback to Instant Answer API if still empty
            if not results:
                try:
                    resp = await client.get(
                        "https://api.duckduckgo.com/",
                        params={"q": clean_query, "format": "json", "no_html": "1"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("AbstractText") and data.get("AbstractURL"):
                            results.append({
                                "title": data.get("Heading", "Instant Answer"),
                                "url": data.get("AbstractURL"),
                                "snippet": data.get("AbstractText"),
                            })
                        for topic in data.get("RelatedTopics", []):
                            if len(results) >= self.max_search_results:
                                break
                            if "Text" in topic and "FirstURL" in topic:
                                results.append({
                                    "title": topic.get("Text")[:80] + "...",
                                    "url": topic.get("FirstURL"),
                                    "snippet": topic.get("Text"),
                                })
                except Exception as e:
                    logger.warning(f"DDG Instant Answer API failed: {e}")

        if not results:
            raise WebSearchError(f"No search results found for: '{clean_query}'")

        return results[:self.max_search_results]

    def _clean_ddg_redirect(self, raw_url: str) -> str:
        """Extract the destination target URL from DuckDuckGo's click redirect."""
        if "/l/?uddg=" in raw_url:
            try:
                parsed = urlparse(raw_url)
                params = parse_qs(parsed.query)
                if "uddg" in params:
                    return unquote(params["uddg"][0])
            except Exception:
                pass
        return raw_url

    def _parse_ddg_html(self, html_content: str) -> List[Dict[str, str]]:
        """Parse search results from DuckDuckGo HTML page."""
        results = []
        matches = re.findall(
            r'<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
            html_content,
            re.IGNORECASE | re.DOTALL,
        )

        snippets = re.findall(
            r'<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>',
            html_content,
            re.IGNORECASE | re.DOTALL,
        )

        for i, (raw_url, raw_title) in enumerate(matches):
            if len(results) >= self.max_search_results:
                break

            url = self._clean_ddg_redirect(raw_url)
            if not url.startswith("http"):
                continue

            clean_title = html.unescape(re.sub(r"<[^>]+>", "", raw_title)).strip()
            clean_snippet = "No summary available."
            if i < len(snippets):
                clean_snippet = html.unescape(re.sub(r"<[^>]+>", "", snippets[i])).strip()

            if clean_title and url:
                results.append({
                    "title": clean_title,
                    "url": url,
                    "snippet": clean_snippet,
                })

        return results

    def _parse_ddg_lite(self, html_content: str) -> List[Dict[str, str]]:
        """Parse search results from DuckDuckGo Lite page."""
        results = []
        link_matches = re.findall(
            r'<a[^>]+class="[^"]*result-link[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
            html_content,
            re.IGNORECASE | re.DOTALL,
        )
        snippet_matches = re.findall(
            r'<td[^>]+class="[^"]*result-snippet[^"]*"[^>]*>(.*?)</td>',
            html_content,
            re.IGNORECASE | re.DOTALL,
        )

        for i, (raw_url, raw_title) in enumerate(link_matches):
            if len(results) >= self.max_search_results:
                break

            url = self._clean_ddg_redirect(raw_url)
            if not url.startswith("http"):
                continue

            clean_title = html.unescape(re.sub(r"<[^>]+>", "", raw_title)).strip()
            clean_snippet = "No summary available."
            if i < len(snippet_matches):
                clean_snippet = html.unescape(re.sub(r"<[^>]+>", "", snippet_matches[i])).strip()

            if clean_title and url:
                results.append({
                    "title": clean_title,
                    "url": url,
                    "snippet": clean_snippet,
                })

        return results

    async def fetch_page_content(self, url: str) -> Optional[str]:
        """
        Fetch full page text converted to clean markdown via Jina Reader (r.jina.ai).
        Falls back to direct GET with HTML text extraction on failure.
        """
        jina_url = f"https://r.jina.ai/{url}"
        headers = {
            "User-Agent": USER_AGENT,
            "X-Return-Format": "markdown",
            "X-Timeout": "5",
        }

        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.get(jina_url, headers=headers)
                if resp.status_code == 200 and resp.text.strip():
                    content = resp.text.strip()
                    # Strip excessive blank lines and markdown noise
                    content = re.sub(r"\n{3,}", "\n\n", content)
                    # Limit each page to 2,500 chars to conserve context window
                    if len(content) > 2500:
                        content = content[:2450] + "\n...[truncated]"
                    return content
        except Exception as e:
            logger.warning(f"Jina Reader fetch failed for {url}: {e}")

        # Fallback: direct fetch and simple paragraph extraction
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    text = resp.text
                    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", text, flags=re.DOTALL | re.IGNORECASE)
                    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", text, flags=re.DOTALL | re.IGNORECASE)
                    clean_paragraphs = [html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in paragraphs if p.strip()]
                    joined = "\n\n".join(clean_paragraphs[:6])
                    if joined:
                        return joined[:1800]
        except Exception as e:
            logger.warning(f"Direct page scrape fallback failed for {url}: {e}")

        return None

    async def research_and_synthesize(self, query: str, session=None) -> str:
        """
        Execute the full research pipeline:
        1. Query search engine with recency heuristics
        2. Rank URLs to select deep article permalinks
        3. Fetch deep page markdown for top article candidates
        4. Reason and synthesize through NARI's LLaMA model
        """
        # Step 1: Search
        search_results = await self.search(query)

        # Step 2: Prioritize deep article permalinks over homepages / category hubs
        sorted_candidates = sorted(
            search_results,
            key=lambda r: self._score_url(r["url"]),
            reverse=True,
        )

        scrape_targets = [r for r in sorted_candidates if self._score_url(r["url"]) > -50][:self.max_pages_to_scrape]
        if not scrape_targets:
            scrape_targets = search_results[:self.max_pages_to_scrape]

        scrape_tasks = [self.fetch_page_content(res["url"]) for res in scrape_targets]
        scraped_contents = await asyncio.gather(*scrape_tasks, return_exceptions=True)

        scraped_map = {}
        for res, deep_content in zip(scrape_targets, scraped_contents):
            if isinstance(deep_content, str) and len(deep_content.strip()) >= 150:
                words = deep_content.split()
                if len(words) >= 30:
                    scraped_map[res["url"]] = deep_content
                    continue
            scraped_map[res["url"]] = res["snippet"]

        enriched_pages = []
        for res in search_results:
            enriched_pages.append({
                "title": res["title"],
                "url": res["url"],
                "snippet": res["snippet"],
                "full_content": scraped_map.get(res["url"], res["snippet"]),
            })

        # Step 3: Synthesis & Reasoning via LLaMA (if session & client available)
        llm_synthesis = None
        if session is not None:
            try:
                from ..ai.llm_client import nim_client
                client = nim_client._get_client(session)
                if client:
                    from ..services.user_service import user_service
                    pref_model = user_service.get_decrypted_setting(session, "ai_model")
                    model = pref_model or "meta/llama-3.2-11b-vision-instruct"
                    fallback_model = "deepseek-ai/deepseek-v4.1-flash"

                    # Prepare high-density research dossier for LLM
                    dossier_text = ""
                    for i, page in enumerate(enriched_pages, 1):
                        dossier_text += f"\n### Source {i}: {page['title']}\n"
                        dossier_text += f"URL: {page['url']}\n"
                        dossier_text += f"Search Snippet: {page['snippet']}\n"
                        if page['full_content'] and page['full_content'] != page['snippet']:
                            dossier_text += f"Article Excerpt:\n{page['full_content']}\n"

                    synth_messages = [
                        {
                            "role": "system",
                            "content": (
                                "You are NARI's High-Density Web Intelligence Synthesizer. Your objective is to extract and summarize "
                                "CONCRETE DATA, SPECIFIC BREAKTHROUGHS, TECHNICAL SPECIFICATIONS, ENTITY NAMES, AND ACTUAL EVENTS "
                                "from the retrieved web evidence.\n\n"
                                "CRITICAL RULES:\n"
                                "1. ABSOLUTELY FORBIDDEN: NEVER output a directory or list of websites or publications (e.g. NEVER say "
                                "'News is available on Cultamu', 'Updates can be found on Humanoid Press', or 'Source X provides articles'). "
                                "The user asked WHAT the developments ARE, not where to read news.\n"
                                "2. EXTRACT CONCRETE DATA: Report the actual entities, company names (e.g., Figure AI, Boston Dynamics, Unitree, "
                                "Tesla, Agility Robotics, Sanctuary AI), robot models (e.g., Figure 02, Atlas, Optimus, G1), technical capabilities "
                                "(degrees of freedom, battery life, tactile sensors, payloads, AI models used), and real-world milestones (deployments, tests, funding).\n"
                                "3. STRUCTURE: Organize by key developments, companies, or breakthroughs using bold headers or bullet points. "
                                "Embed markdown citations naturally at the end of statements, e.g., 'Figure AI announced deployment at BMW ([Figure AI News](url)).'\n"
                                "4. SPARSE OR META EVIDENCE: If the retrieved web content only contains site headers or navigation links without deep event details, "
                                "synthesize whatever factual clues exist in the snippets, highlight the active industry trends (e.g. commercial warehouse deployments, "
                                "embodied AI foundation models, tactile dexterity), and state clearly what specific advancements are currently taking place."
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"Research Query: \"{query}\"\n\nRetrieved Web Evidence:\n{dossier_text}",
                        },
                    ]

                    try:
                        resp = await asyncio.wait_for(
                            client.chat.completions.create(
                                model=model,
                                messages=synth_messages,
                                max_tokens=650,
                                temperature=0.2,
                            ),
                            timeout=8.0,
                        )
                    except Exception as model_err:
                        if model != fallback_model:
                            logger.info(f"Primary model '{model}' timed out or failed ({model_err}), retrying with '{fallback_model}'...")
                            resp = await asyncio.wait_for(
                                client.chat.completions.create(
                                    model=fallback_model,
                                    messages=synth_messages,
                                    max_tokens=650,
                                    temperature=0.2,
                                ),
                                timeout=18.0,
                            )
                        else:
                            raise model_err

                    llm_synthesis = resp.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"AI synthesis failed, falling back to structured dossier: {e}")

        # Assemble final report
        if llm_synthesis:
            report_lines = [
                f"### Online Intelligence Report: {query}",
                "",
                llm_synthesis,
                "",
                "#### Sources Analyzed:",
            ]
            for page in enriched_pages:
                report_lines.append(f"- [{page['title']}]({page['url']}) — {page['snippet'][:120]}...")
            return "\n".join(report_lines)

        # Fallback: Structured dossier format without separate LLM synthesis
        report_lines = [f"Online search results for \"{query}\":\n"]
        for i, page in enumerate(enriched_pages, 1):
            report_lines.append(f"{i}. [{page['title']}]({page['url']})")
            report_lines.append(f"   Summary: {page['snippet']}")
            if page['full_content'] and page['full_content'] != page['snippet']:
                preview = page['full_content'][:300].replace('\n', ' ')
                report_lines.append(f"   Excerpt: {preview}...")
            report_lines.append("")

        return "\n".join(report_lines)


async def perform_web_search(query: str, session=None) -> str:
    """
    Perform a web search with deep page fetching and optional cognitive reasoning synthesis.
    
    Args:
        query: The search query string
        session: Optional SQLModel DB session for invoking NIM reasoning model
        
    Returns:
        Synthesized and reasoned research response with source citations.
    """
    try:
        engine = WebResearchEngine()
        return await engine.research_and_synthesize(query, session=session)
    except WebSearchError as e:
        return f"Web search notice: {str(e)}"
    except Exception as e:
        return f"Unexpected error during web research: {str(e)}"
