"""Web search utility for NARI using SearXNG (Self-hosted Meta-Search)."""

import asyncio
from typing import List, Dict, Any
import httpx
from ..core.config import settings


class WebSearchError(Exception):
    """Custom exception for web search errors."""
    pass


class SearXNGSearch:
    """SearXNG search client for self-hosted meta-search."""
    
    def __init__(self, base_url: str = None, timeout: float = 15.0, max_results: int = 5):
        self.base_url = base_url or settings.SEARXNG_URL
        self.timeout = timeout
        self.max_results = max_results
        self.search_url = f"{self.base_url.rstrip('/')}/search"
    
    async def search(self, query: str) -> List[Dict[str, str]]:
        """
        Perform a SearXNG search with connection retries and return parsed results.
        
        Args:
            query: The search query string
            
        Returns:
            List of dictionaries containing title, url, and snippet
            
        Raises:
            WebSearchError: If search fails or no results found
        """
        if not query or not query.strip():
            raise WebSearchError("Search query cannot be empty")
        
        params = {
            "q": query.strip(),
            "format": "json",
            "engines": "google,bing,duckduckgo,brave,wikipedia",
            "pageno": 1
        }
        
        max_retries = 3
        backoff = 0.5
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                    response = await client.get(self.search_url, params=params)
                    
                    if response.status_code != 200:
                        raise WebSearchError(f"HTTP {response.status_code}: Failed to connect to SearXNG")
                    
                    data = response.json()
                    results = data.get("results", [])
                    
                    if not results:
                        raise WebSearchError("No search results returned from SearXNG")
                    
                    return self._process_results(results)
                    
            except (httpx.RequestError, httpx.TimeoutException, WebSearchError) as e:
                if attempt == max_retries - 1:
                    raise WebSearchError(f"Failed to connect to SearXNG after {max_retries} attempts: {str(e)}")
                await asyncio.sleep(backoff)
                backoff *= 2
            except Exception as e:
                raise WebSearchError(f"Unexpected error during search: {str(e)}")
    
    def _process_results(self, raw_results: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Process, clean, and deduplicate raw results from SearXNG to optimize context window tokens."""
        processed = []
        seen_urls = set()
        
        for r in raw_results:
            if len(processed) >= self.max_results:
                break
                
            title = r.get("title", "No Title").strip()
            url = r.get("url", "")
            
            # Clean URL to strip common tracking queries (utm_*)
            if "?" in url:
                try:
                    from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
                    u = urlparse(url)
                    clean_query = [(k, v) for k, v in parse_qsl(u.query) if not k.startswith("utm_")]
                    url = urlunparse(u._replace(query=urlencode(clean_query)))
                except Exception:
                    pass # Fallback to original URL on parse error
            
            # Deduplicate by URL
            if url in seen_urls:
                continue
                
            snippet = r.get("content", r.get("template", "No description available."))
            
            # Clean snippet from HTML tags if present
            import re
            snippet = re.sub(r'<[^>]+>', '', snippet)
            # Collapse multiple spaces, newlines, tabs
            snippet = re.sub(r'\s+', ' ', snippet).strip()
            # Truncate snippet to 300 characters to conserve LLM tokens
            if len(snippet) > 300:
                snippet = snippet[:297] + "..."
            
            if title and url:
                processed.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet
                })
                seen_urls.add(url)
        
        return processed
    
    def format_results(self, results: List[Dict[str, str]]) -> str:
        """Format search results into a readable string for the LLM."""
        if not results:
            return "No results found."
        
        formatted_results = []
        for i, result in enumerate(results, 1):
            formatted_results.append(
                f"{i}. {result['title']}\n"
                f"   URL: {result['url']}\n"
                f"   Summary: {result['snippet']}\n"
            )
        
        return "\n".join(formatted_results)


async def perform_web_search(query: str) -> str:
    """
    Perform a web search using SearXNG and return formatted results.
    
    Args:
        query: The search query string
        
    Returns:
        Formatted search results string
    """
    try:
        searcher = SearXNGSearch()
        results = await searcher.search(query)
        return searcher.format_results(results)
    except WebSearchError as e:
        # Fallback message if SearXNG is not running/available
        return f"Web search error: {str(e)}. (Ensure SearXNG is running at {settings.SEARXNG_URL})"
    except Exception as e:
        return f"Unexpected error during web search: {str(e)}"
