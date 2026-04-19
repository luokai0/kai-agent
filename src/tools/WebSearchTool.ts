/**
 * WebSearchTool - Web search tool
 * Based on Claude Code's WebSearch implementation
 * 
 * Search the web for information using various search engines.
 * Supports multiple providers, filtering, and result ranking.
 */

import { buildTool } from './Tool'
import { z } from 'zod'
import { spawn } from 'child_process'

// Search provider types
const SearchProviderSchema = z.enum([
  'duckduckgo',
  'google',
  'bing',
  'serper',
  'serpapi',
  'custom',
])

// Web search input schema
const WebSearchInputSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  provider: SearchProviderSchema.optional().default('duckduckgo').describe('Search provider'),
  maxResults: z.number().min(1).max(100).optional().default(10).describe('Maximum results'),
  offset: z.number().min(0).optional().default(0).describe('Result offset for pagination'),
  language: z.string().optional().default('en').describe('Language code'),
  region: z.string().optional().describe('Region/country code'),
  safeSearch: z.enum(['off', 'moderate', 'strict']).optional().default('moderate').describe('Safe search level'),
  timeRange: z.enum(['day', 'week', 'month', 'year', 'any']).optional().default('any').describe('Time range'),
  fileType: z.string().optional().describe('File type filter (pdf, doc, etc.)'),
  site: z.string().optional().describe('Limit to specific site'),
  excludeSite: z.array(z.string()).optional().describe('Sites to exclude'),
  includeTerms: z.array(z.string()).optional().describe('Terms that must be present'),
  excludeTerms: z.array(z.string()).optional().describe('Terms to exclude'),
  exactPhrase: z.string().optional().describe('Exact phrase to match'),
  newsOnly: z.boolean().optional().default(false).describe('Search news only'),
  imagesOnly: z.boolean().optional().default(false).describe('Search images only'),
  videosOnly: z.boolean().optional().default(false).describe('Search videos only'),
  sortBy: z.enum(['relevance', 'date', 'rank']).optional().default('relevance').describe('Sort order'),
  extractContent: z.boolean().optional().default(false).describe('Extract content from results'),
  maxContentLength: z.number().optional().default(5000).describe('Max content to extract per result'),
  timeout: z.number().optional().default(30000).describe('Request timeout in ms'),
})

type WebSearchInput = z.infer<typeof WebSearchInputSchema>

// Search result schema
const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  publishedDate: z.string().optional(),
  author: z.string().optional(),
  source: z.string().optional(),
  position: z.number().optional(),
  thumbnail: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.string().optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  availability: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Web search output schema
const WebSearchOutputSchema = z.object({
  results: z.array(SearchResultSchema),
  totalResults: z.number().optional(),
  searchTime: z.number(),
  query: z.string(),
  provider: z.string(),
  hasMore: z.boolean().optional(),
  refinedQuery: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  relatedSearches: z.array(z.string()).optional(),
  knowledge: z.any().optional(),
  error: z.string().optional(),
})

type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>

// Search engine configurations
const SEARCH_ENGINES = {
  duckduckgo: {
    url: 'https://html.duckduckgo.com/html/',
    param: 'q',
  },
  google: {
    url: 'https://www.google.com/search',
    param: 'q',
  },
  serper: {
    url: 'https://google.serper.dev/search',
    apiKey: 'SERPER_API_KEY',
  },
  serpapi: {
    url: 'https://serpapi.com/search',
    apiKey: 'SERPAPI_KEY',
  },
}

/**
 * Execute web search
 */
async function executeWebSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  const startTime = Date.now()
  
  try {
    // Build search query
    const query = buildSearchQuery(input)
    
    // Execute search based on provider
    let results: any[] = []
    
    switch (input.provider) {
      case 'duckduckgo':
        results = await searchDuckDuckGo(query, input)
        break
      case 'google':
        results = await searchGoogle(query, input)
        break
      case 'serper':
        results = await searchSerper(query, input)
        break
      case 'serpapi':
        results = await searchSerpApi(query, input)
        break
      default:
        results = await searchDuckDuckGo(query, input)
    }
    
    // Extract content if requested
    if (input.extractContent && results.length > 0) {
      results = await extractContentFromResults(results, input.maxContentLength || 5000)
    }
    
    return {
      results,
      totalResults: results.length,
      searchTime: Date.now() - startTime,
      query: input.query,
      provider: input.provider || 'duckduckgo',
    }
  } catch (error: any) {
    return {
      results: [],
      searchTime: Date.now() - startTime,
      query: input.query,
      provider: input.provider || 'duckduckgo',
      error: error.message,
    }
  }
}

/**
 * Build search query with operators
 */
function buildSearchQuery(input: WebSearchInput): string {
  let query = input.query
  
  // Add site restriction
  if (input.site) {
    query = `site:${input.site} ${query}`
  }
  
  // Add file type
  if (input.fileType) {
    query = `filetype:${input.fileType} ${query}`
  }
  
  // Add exact phrase
  if (input.exactPhrase) {
    query = `"${input.exactPhrase}" ${query}`
  }
  
  // Add include terms
  if (input.includeTerms && input.includeTerms.length > 0) {
    query = input.includeTerms.map(t => `+${t}`).join(' ') + ' ' + query
  }
  
  // Add exclude terms
  if (input.excludeTerms && input.excludeTerms.length > 0) {
    query = input.excludeTerms.map(t => `-${t}`).join(' ') + ' ' + query
  }
  
  // Add exclude sites
  if (input.excludeSite && input.excludeSite.length > 0) {
    query = input.excludeSite.map(s => `-site:${s}`).join(' ') + ' ' + query
  }
  
  // Add time range
  if (input.timeRange && input.timeRange !== 'any') {
    const timeMap: Record<string, string> = {
      day: 'd',
      week: 'w',
      month: 'm',
      year: 'y',
    }
    query = `${query} &tbs=qdr:${timeMap[input.timeRange]}`
  }
  
  return query.trim()
}

/**
 * Search using DuckDuckGo (HTML scraping)
 */
async function searchDuckDuckGo(query: string, input: WebSearchInput): Promise<any[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  })
  
  const html = await response.text()
  return parseDuckDuckGoResults(html, input.maxResults || 10)
}

/**
 * Parse DuckDuckGo HTML results
 */
function parseDuckDuckGoResults(html: string, maxResults: number): any[] {
  const results: any[] = []
  
  // Simple regex parsing for demonstration
  // In production, use a proper HTML parser
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g
  const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g
  
  let match
  let index = 0
  
  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const url = match[1]
    const title = match[2]
    
    // Get snippet
    const snippetMatch = snippetRegex.exec(html)
    const snippet = snippetMatch ? snippetMatch[1] : ''
    
    results.push({
      title,
      url,
      snippet,
      position: index++,
    })
  }
  
  return results
}

/**
 * Search using Google (via Serper API)
 */
async function searchSerper(query: string, input: WebSearchInput): Promise<any[]> {
  const apiKey = process.env.SERPER_API_KEY
  
  if (!apiKey) {
    // Fallback to DuckDuckGo if no API key
    return searchDuckDuckGo(query, input)
  }
  
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: input.maxResults || 10,
      hl: input.language || 'en',
      gl: input.region || 'us',
      safe: input.safeSearch,
    }),
  })
  
  const data = await response.json()
  
  return (data.organic || []).map((result: any, index: number) => ({
    title: result.title,
    url: result.link,
    snippet: result.snippet,
    position: index,
    position: result.position,
  }))
}

/**
 * Search using SerpAPI
 */
async function searchSerpApi(query: string, input: WebSearchInput): Promise<any[]> {
  const apiKey = process.env.SERPAPI_KEY
  
  if (!apiKey) {
    return searchDuckDuckGo(query, input)
  }
  
  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    num: String(input.maxResults || 10),
    hl: input.language || 'en',
    gl: input.region || 'us',
  })
  
  const response = await fetch(`https://serpapi.com/search?${params}`)
  const data = await response.json()
  
  return (data.organic_results || []).map((result: any, index: number) => ({
    title: result.title,
    url: result.link,
    snippet: result.snippet,
    position: index,
  }))
}

/**
 * Search using direct Google (limited, may be blocked)
 */
async function searchGoogle(query: string, input: WebSearchInput): Promise<any[]> {
  // Google often blocks automated requests
  // Fallback to DuckDuckGo
  return searchDuckDuckGo(query, input)
}

/**
 * Extract content from result URLs
 */
async function extractContentFromResults(results: any[], maxLength: number): Promise<any[]> {
  const enhanced = []
  
  for (const result of results.slice(0, 5)) { // Only extract first 5
    try {
      const response = await fetch(result.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KaiAgent/1.0)',
        },
      })
      
      const text = await response.text()
      // Simple text extraction (in production, use proper parser)
      const content = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)
      
      enhanced.push({
        ...result,
        content,
      })
    } catch {
      enhanced.push(result)
    }
  }
  
  // Add remaining results without content
  enhanced.push(...results.slice(5))
  
  return enhanced
}

/**
 * Format web search output
 */
function formatWebSearchOutput(output: WebSearchOutput): string {
  const lines: string[] = []
  
  lines.push(`Search: "${output.query}"`)
  lines.push(`Provider: ${output.provider}`)
  lines.push(`Time: ${output.searchTime}ms`)
  lines.push(`Results: ${output.results.length}`)
  lines.push('')
  
  for (const result of output.results) {
    lines.push(`[${result.position !== undefined ? result.position + 1 : ''}] ${result.title}`)
    lines.push(`    URL: ${result.url}`)
    if (result.snippet) {
      lines.push(`    ${result.snippet}`)
    }
    if (result.content) {
      lines.push(`    Content: ${result.content.slice(0, 200)}...`)
    }
    lines.push('')
  }
  
  if (output.suggestions && output.suggestions.length > 0) {
    lines.push('Suggestions:')
    output.suggestions.forEach(s => lines.push(`  - ${s}`))
  }
  
  if (output.relatedSearches && output.relatedSearches.length > 0) {
    lines.push('Related:')
    output.relatedSearches.forEach(s => lines.push(`  - ${s}`))
  }
  
  return lines.join('\n')
}

/**
 * WebSearchTool - Search the web
 */
export const WebSearchTool = buildTool({
  name: 'WebSearch',
  description: 'Search the web for information using various search engines. Supports filtering, pagination, and content extraction.',
  inputSchema: WebSearchInputSchema,
  outputSchema: WebSearchOutputSchema,
  
  call: async (input: WebSearchInput, context: any) => {
    const result = await executeWebSearch(input)
    return {
      ok: true,
      output: result,
      display: formatWebSearchOutput(result),
    }
  },
  
  checkPermissions: async (input: WebSearchInput, context: any) => {
    // Web search is generally safe
    return { behavior: 'allow' }
  },
  
  validateInput: (input: unknown) => {
    return WebSearchInputSchema.safeParse(input)
  },
  
  getRiskLevel: (input: WebSearchInput) => {
    return 'low'
  },
  
  getSummaryForPermission: (input: WebSearchInput) => {
    return `Web search for: "${input.query}"`
  },
})

// Export types
export { WebSearchInput, WebSearchOutput, WebSearchInputSchema, WebSearchOutputSchema, SearchResultSchema }
export default WebSearchTool
