"""Web search utility for NARI using DuckDuckGo with improved parsing and error handling."""

import re
import asyncio
from typing import List, Dict, Optional
import httpx
from bs4 import BeautifulSoup


class WebSearchError(Exception):
    """Custom exception for web search errors."""
    pass


class DuckDuckGoSearch:
    """DuckDuckGo search client with improved result parsing."""
    
    def __init__(self, timeout: float = 10.0, max_results: int = 5):
        self.timeout = timeout
        self.max_results = max_results
        self.base_url = "https://html.duckduckgo.com/html/"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
    
    async def search(self, query: str) -> List[Dict[str, str]]:
        """
        Perform a DuckDuckGo search and return parsed results.
        
        Args:
            query: The search query string
            
        Returns:
            List of dictionaries containing title, url, and snippet
            
        Raises:
            WebSearchError: If search fails or no results found
        """
        if not query or not query.strip():
            raise WebSearchError("Search query cannot be empty")
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.base_url,
                    params={"q": query.strip()},
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    raise WebSearchError(f"HTTP {response.status_code}: Failed to retrieve search results")
                
                return self._parse_results(response.text)
                
        except httpx.TimeoutException:
            raise WebSearchError("Search request timed out")
        except httpx.RequestError as e:
            raise WebSearchError(f"Network error: {str(e)}")
        except Exception as e:
            raise WebSearchError(f"Unexpected error during search: {str(e)}")
    
    def _parse_results(self, html: str) -> List[Dict[str, str]]:
        """
        Parse DuckDuckGo HTML results using BeautifulSoup.
        
        Args:
            html: Raw HTML response from DuckDuckGo
            
        Returns:
            List of parsed search results
        """
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        
        # Find all result containers
        result_containers = soup.find_all('div', class_='result')
        
        for container in result_containers[:self.max_results]:
            try:
                # Extract title and URL
                title_element = container.find('a', class_='result__url')
                if not title_element:
                    # Fallback to other possible title selectors
                    title_element = container.find('a', class_='result__a')
                
                if not title_element:
                    continue
                    
                title = title_element.get_text(strip=True)
                url = title_element.get('href', '')
                
                # Clean up DuckDuckGo redirect URLs
                if url.startswith('/duckgo/'):
                    # Extract actual URL from duckduckgo redirect
                    match = re.search(r'uddg=([^&]+)', url)
                    if match:
                        import urllib.parse
                        url = urllib.parse.unquote(match.group(1))
                    else:
                        continue  # Skip if we can't extract the real URL
                
                # Extract snippet/description
                snippet_element = container.find('a', class_='result__snippet')
                if not snippet_element:
                    # Fallback to other possible snippet selectors
                    snippet_element = container.find('div', class_='result__snippet')
                
                snippet = snippet_element.get_text(strip=True) if snippet_element else "No description available"
                
                # Only add results with meaningful content
                if title and len(title) > 3:
                    results.append({
                        'title': title,
                        'url': url,
                        'snippet': snippet
                    })
                    
            except Exception:
                # Skip malformed results but continue processing others
                continue
        
        if not results:
            raise WebSearchError("No valid search results found")
            
        return results
    
    def format_results(self, results: List[Dict[str, str]]) -> str:
        """
        Format search results into a readable string.
        
        Args:
            results: List of search result dictionaries
            
        Returns:
            Formatted string representation of results
        """
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


# Global search instance for reuse
_web_search_instance = None


def get_web_search_instance() -> DuckDuckGoSearch:
    """Get or create a global web search instance."""
    global _web_search_instance
    if _web_search_instance is None:
        _web_search_instance = DuckDuckGoSearch()
    return _web_search_instance


async def perform_web_search(query: str) -> str:
    """
    Perform a web search and return formatted results.
    
    This is the main function to be used by the AI tool system.
    
    Args:
        query: The search query string
        
    Returns:
        Formatted search results string
    """
    try:
        searcher = get_web_search_instance()
        results = await searcher.search(query)
        return searcher.format_results(results)
    except WebSearchError as e:
        return f"Web search error: {str(e)}"
    except Exception as e:
        return f"Unexpected error during web search: {str(e)}"