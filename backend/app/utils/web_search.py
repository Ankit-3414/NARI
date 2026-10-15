"""Web search and online research reasoning utility for NARI.

Operates keyless and container-free:
1. Performs search via DuckDuckGo (HTML / Lite / API).
2. Fetches full page content in clean markdown via Jina Reader (r.jina.ai).
3. Synthesizes and reasons over the findings using NARI's cognitive LLM (LLaMA 3.1 70B/8B).
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

    def __init__(self, max_search_results: int = 4, max_pages_to_scrape: int = 2):
        self.max_search_results = max_search_results
        self.max_pages_to_scrape = max_pages_to_scrape

    async def search(self, query: str) -> List[Dict[str, str]]:
        """Search DuckDuckGo with fallback mechanisms."""
        if not query or not query.strip():
            raise WebSearchError("Search query cannot be empty")

        clean_query = query.strip()
        results: List[Dict[str, str]] = []

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://duckduckgo.com/",
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            # 1. Try DuckDuckGo HTML endpoint
            try:
                resp = await client.post(
                    "https://html.duckduckgo.com/html/",
                    data={"q": clean_query, "b": ""},
                )
                if resp.status_code == 200:
                    results = self._parse_ddg_html(resp.text)
            except Exception as e:
                logger.warning(f"DDG HTML search failed: {e}")

            # 2. Fallback to DuckDuckGo Lite endpoint if needed
            if not results:
                try:
                    resp = await client.post(
                        "https://lite.duckduckgo.com/lite/",
                        data={"q": clean_query},
                    )
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
        # Pattern for HTML result blocks
        # <a class="result__url" href="..."> or <a class="result__snippet" ...>
        # Result titles are inside <a class="result__a" href="...">title</a>
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

            # Strip HTML tags from title
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
        # In lite view, results are in table rows with class="result-link" and class="result-snippet"
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
                    # Limit each page to 2,000 chars to conserve context window
                    if len(content) > 2000:
                        content = content[:1950] + "\n...[truncated]"
                    return content
        except Exception as e:
            logger.warning(f"Jina Reader fetch failed for {url}: {e}")

        # Fallback: direct fetch and simple paragraph extraction
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    text = resp.text
                    # Remove scripts and styles
                    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", text, flags=re.DOTALL | re.IGNORECASE)
                    # Extract paragraph text
                    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", text, flags=re.DOTALL | re.IGNORECASE)
                    clean_paragraphs = [html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in paragraphs if p.strip()]
                    joined = "\n\n".join(clean_paragraphs[:5])
                    if joined:
                        return joined[:1500]
        except Exception as e:
            logger.warning(f"Direct page scrape fallback failed for {url}: {e}")

        return None

    async def research_and_synthesize(self, query: str, session=None) -> str:
        """
        Execute the full research pipeline:
        1. Query search engine
        2. Fetch deep page markdown for top pages
        3. Reason and synthesize through NARI's LLaMA model
        """
        # Step 1: Search
        search_results = await self.search(query)

        # Step 2: Fetch deep content concurrently for the top results
        enriched_pages = []
        scrape_targets = search_results[:self.max_pages_to_scrape]
        scrape_tasks = [self.fetch_page_content(res["url"]) for res in scrape_targets]
        scraped_contents = await asyncio.gather(*scrape_tasks, return_exceptions=True)

        for res, deep_content in zip(scrape_targets, scraped_contents):
            actual_content = deep_content if isinstance(deep_content, str) and deep_content else res["snippet"]
            enriched_pages.append({
                "title": res["title"],
                "url": res["url"],
                "snippet": res["snippet"],
                "full_content": actual_content,
            })

        # Add remaining snippets that weren't scraped deeply
        for res in search_results[self.max_pages_to_scrape:]:
            enriched_pages.append({
                "title": res["title"],
                "url": res["url"],
                "snippet": res["snippet"],
                "full_content": res["snippet"],
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
                    model = pref_model or "deepseek-ai/deepseek-v4.1-flash"
                    fallback_model = "meta/llama-3.2-11b-vision-instruct"

                    # Prepare research dossier for LLM
                    dossier_text = ""
                    for i, page in enumerate(enriched_pages, 1):
                        dossier_text += f"\n### Source {i}: {page['title']}\n"
                        dossier_text += f"URL: {page['url']}\n"
                        dossier_text += f"Content:\n{page['full_content']}\n"

                    synth_messages = [
                        {
                            "role": "system",
                            "content": (
                                "You are NARI's Web Intelligence Synthesizer. Based on the user's research query and the retrieved "
                                "web pages below, provide a direct, insightful, and well-reasoned answer. "
                                "Synthesize key facts, evaluate conflicting points if any, and cite sources naturally using markdown links [Source Title](URL). "
                                "Be concise, precise, and authoritative."
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
                                max_tokens=350,
                                temperature=0.2,
                            ),
                            timeout=6.0,
                        )
                    except Exception as model_err:
                        if model != fallback_model:
                            logger.info(f"Primary model '{model}' timed out or failed ({model_err}), retrying with '{fallback_model}'...")
                            resp = await asyncio.wait_for(
                                client.chat.completions.create(
                                    model=fallback_model,
                                    messages=synth_messages,
                                    max_tokens=350,
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
