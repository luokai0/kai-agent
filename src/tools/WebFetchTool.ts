/**
 * WebFetchTool - Fetch web content tool
 * Based on Claude Code's WebFetch implementation
 * 
 * Fetch and extract content from web pages.
 * Supports various content types and extraction modes.
 */

import { buildTool } from './Tool'
import { z } from 'zod'
import * as cheerio from 'cheerio'

// Web fetch input schema
const WebFetchInputSchema = z.object({
  url: z.string().url().describe('URL to fetch'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']).optional().default('GET').describe('HTTP method'),
  headers: z.record(z.string()).optional().describe('Request headers'),
  body: z.any().optional().describe('Request body'),
  timeout: z.number().optional().default(30000).describe('Request timeout in ms'),
  followRedirects: z.boolean().optional().default(true).describe('Follow HTTP redirects'),
  maxRedirects: z.number().optional().default(5).describe('Maximum redirects'),
  cookies: z.string().optional().describe('Cookies to send'),
  userAgent: z.string().optional().describe('User agent string'),
  proxy: z.string().optional().describe('Proxy URL'),
  extract: z.enum(['text', 'html', 'markdown', 'json', 'links', 'images', 'metadata', 'auto']).optional().default('auto').describe('Extraction mode'),
  selector: z.string().optional().describe('CSS selector for content extraction'),
  removeSelectors: z.array(z.string()).optional().describe('CSS selectors to remove'),
  maxContentLength: z.number().optional().default(100000).describe('Maximum content length'),
  includeHeaders: z.boolean().optional().default(false).describe('Include response headers'),
  includeStatus: z.boolean().optional().default(true).describe('Include response status'),
  raw: z.boolean().optional().default(false).describe('Return raw response'),
  encoding: z.string().optional().default('utf-8').describe('Response encoding'),
  validateSsl: z.boolean().optional().default(true).describe('Validate SSL certificates'),
  retry: z.number().optional().default(2).describe('Number of retries'),
  retryDelay: z.number().optional().default(1000).describe('Delay between retries'),
  cache: z.boolean().optional().default(true).describe('Cache response'),
  cacheTTL: z.number().optional().default(3600000).describe('Cache TTL in ms'),
})

type WebFetchInput = z.infer<typeof WebFetchInputSchema>

// Link schema
const LinkSchema = z.object({
  url: z.string(),
  text: z.string().optional(),
  title: z.string().optional(),
  rel: z.string().optional(),
  target: z.string().optional(),
})

// Image schema
const ImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  title: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

// Metadata schema
const MetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  author: z.string().optional(),
  publishDate: z.string().optional(),
  modifiedDate: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogUrl: z.string().optional(),
  ogType: z.string().optional(),
  twitterCard: z.string().optional(),
  twitterSite: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robots: z.string().optional(),
  language: z.string().optional(),
  favicon: z.string().optional(),
})

// Web fetch output schema
const WebFetchOutputSchema = z.object({
  url: z.string(),
  finalUrl: z.string().optional().describe('Final URL after redirects'),
  status: z.number().optional(),
  statusText: z.string().optional(),
  headers: z.record(z.string()).optional(),
  content: z.any().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  markdown: z.string().optional(),
  json: z.any().optional(),
  links: z.array(LinkSchema).optional(),
  images: z.array(ImageSchema).optional(),
  metadata: MetadataSchema.optional(),
  size: z.number().optional(),
  duration: z.number(),
  cached: z.boolean().optional(),
  error: z.string().optional(),
})

type WebFetchOutput = z.infer<typeof WebFetchOutputSchema>

// Response cache
const responseCache = new Map<string, { data: any; timestamp: number }>()

/**
 * Execute web fetch
 */
async function executeWebFetch(input: WebFetchInput): Promise<WebFetchOutput> {
  const startTime = Date.now()
  
  try {
    // Check cache
    if (input.cache) {
      const cached = responseCache.get(input.url)
      if (cached && Date.now() - cached.timestamp < (input.cacheTTL || 3600000)) {
        return {
          ...cached.data,
          cached: true,
        }
      }
    }
    
    // Build request options
    const options: RequestInit = {
      method: input.method,
      headers: buildHeaders(input),
      redirect: input.followRedirects ? 'follow' : 'manual',
      signal: AbortSignal.timeout(input.timeout || 30000),
    }
    
    if (input.body && ['POST', 'PUT', 'PATCH'].includes(input.method || 'GET')) {
      options.body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body)
    }
    
    // Execute request with retries
    let response: Response | null = null
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= (input.retry || 2); attempt++) {
      try {
        response = await fetch(input.url, options)
        break
      } catch (error: any) {
        lastError = error
        if (attempt < (input.retry || 2)) {
          await sleep(input.retryDelay || 1000)
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('Request failed')
    }
    
    // Extract content
    const result = await extractContent(response, input)
    
    const output: WebFetchOutput = {
      url: input.url,
      finalUrl: response.url !== input.url ? response.url : undefined,
      status: response.status,
      statusText: response.statusText,
      headers: input.includeHeaders ? Object.fromEntries(response.headers) : undefined,
      duration: Date.now() - startTime,
      ...result,
    }
    
    // Cache result
    if (input.cache && response.ok) {
      responseCache.set(input.url, {
        data: output,
        timestamp: Date.now(),
      })
    }
    
    return output
  } catch (error: any) {
    return {
      url: input.url,
      duration: Date.now() - startTime,
      error: error.message,
    }
  }
}

/**
 * Build request headers
 */
function buildHeaders(input: WebFetchInput): HeadersInit {
  const headers: Record<string, string> = {
    'User-Agent': input.userAgent || 'Mozilla/5.0 (compatible; KaiAgent/1.0)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    ...input.headers,
  }
  
  if (input.cookies) {
    headers['Cookie'] = input.cookies
  }
  
  return headers
}

/**
 * Extract content from response
 */
async function extractContent(response: Response, input: WebFetchInput): Promise<Partial<WebFetchOutput>> {
  const contentType = response.headers.get('content-type') || ''
  
  // Handle raw mode
  if (input.raw) {
    const buffer = await response.arrayBuffer()
    return {
      content: buffer,
      size: buffer.byteLength,
    }
  }
  
  // Handle JSON response
  if (contentType.includes('application/json') || input.extract === 'json') {
    const json = await response.json()
    return {
      json,
      text: JSON.stringify(json, null, 2),
      size: JSON.stringify(json).length,
    }
  }
  
  // Handle HTML/text response
  const html = await response.text()
  
  // Determine extraction mode
  let extractMode = input.extract
  if (extractMode === 'auto') {
    if (contentType.includes('application/json')) {
      extractMode = 'json'
    } else if (contentType.includes('text/plain')) {
      extractMode = 'text'
    } else {
      extractMode = 'markdown'
    }
  }
  
  // Apply size limit
  const limitedHtml = html.slice(0, input.maxContentLength || 100000)
  
  // Load cheerio for HTML parsing
  const $ = cheerio.load(limitedHtml)
  
  // Remove unwanted elements
  const removeSelectors = input.removeSelectors || [
    'script', 'style', 'nav', 'footer', 'header',
    'aside', '.ads', '.sidebar', '.comments', '.related',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  ]
  removeSelectors.forEach(selector => $(selector).remove())
  
  // Apply custom remove selectors
  if (input.removeSelectors) {
    input.removeSelectors.forEach(selector => $(selector).remove())
  }
  
  // Select specific content if selector provided
  if (input.selector) {
    const selected = $(input.selector)
    if (selected.length > 0) {
      $('body').html(selected.html() || '')
    }
  }
  
  // Extract based on mode
  const result: Partial<WebFetchOutput> = {
    html: limitedHtml,
    size: limitedHtml.length,
  }
  
  switch (extractMode) {
    case 'text':
      result.text = extractText($)
      break
    
    case 'markdown':
      result.markdown = extractMarkdown($)
      result.text = result.markdown
      break
    
    case 'links':
      result.links = extractLinks($, input.url)
      break
    
    case 'images':
      result.images = extractImages($, input.url)
      break
    
    case 'metadata':
      result.metadata = extractMetadata($, input.url)
      break
    
    default:
      result.text = extractText($)
      result.markdown = extractMarkdown($)
      result.links = extractLinks($, input.url)
      result.images = extractImages($, input.url)
      result.metadata = extractMetadata($, input.url)
  }
  
  return result
}

/**
 * Extract plain text from HTML
 */
function extractText($: cheerio.CheerioAPI): string {
  return $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}

/**
 * Convert HTML to Markdown
 */
function extractMarkdown($: cheerio.CheerioAPI): string {
  const markdown: string[] = []
  
  // Extract title
  const title = $('title').text().trim()
  if (title) {
    markdown.push(`# ${title}\n`)
  }
  
  // Process body content
  $('body').find('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, code, table, a, strong, em, img, br').each((_, el) => {
    const $el = $(el)
    const tag = el.tagName?.toLowerCase()
    
    switch (tag) {
      case 'h1':
        markdown.push(`\n# ${$el.text().trim()}\n`)
        break
      case 'h2':
        markdown.push(`\n## ${$el.text().trim()}\n`)
        break
      case 'h3':
        markdown.push(`\n### ${$el.text().trim()}\n`)
        break
      case 'h4':
        markdown.push(`\n#### ${$el.text().trim()}\n`)
        break
      case 'h5':
        markdown.push(`\n##### ${$el.text().trim()}\n`)
        break
      case 'h6':
        markdown.push(`\n###### ${$el.text().trim()}\n`)
        break
      case 'p':
        markdown.push(`\n${$el.text().trim()}\n`)
        break
      case 'blockquote':
        markdown.push(`\n> ${$el.text().trim()}\n`)
        break
      case 'pre':
      case 'code':
        const code = $el.text().trim()
        if (tag === 'pre' || code.includes('\n')) {
          markdown.push(`\n\`\`\`\n${code}\n\`\`\`\n`)
        } else {
          markdown.push(`\`${code}\``)
        }
        break
      case 'strong':
      case 'b':
        markdown.push(`**${$el.text().trim()}**`)
        break
      case 'em':
      case 'i':
        markdown.push(`*${$el.text().trim()}*`)
        break
      case 'a':
        const href = $el.attr('href')
        const text = $el.text().trim()
        if (href && text) {
          markdown.push(`[${text}](${href})`)
        }
        break
      case 'img':
        const src = $el.attr('src')
        const alt = $el.attr('alt') || ''
        if (src) {
          markdown.push(`![${alt}](${src})`)
        }
        break
      case 'br':
        markdown.push('\n')
        break
      case 'ul':
        $el.find('li').each((_, li) => {
          markdown.push(`- ${$(li).text().trim()}`)
        })
        break
      case 'ol':
        $el.find('li').each((i, li) => {
          markdown.push(`${i + 1}. ${$(li).text().trim()}`)
        })
        break
    }
  })
  
  return markdown.join('').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Extract links from HTML
 */
function extractLinks($: cheerio.CheerioAPI, baseUrl: string): any[] {
  const links: any[] = []
  
  $('a[href]').each((_, el) => {
    const $el = $(el)
    const href = $el.attr('href')
    
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      // Resolve relative URLs
      const url = new URL(href, baseUrl).href
      
      links.push({
        url,
        text: $el.text().trim(),
        title: $el.attr('title'),
        rel: $el.attr('rel'),
        target: $el.attr('target'),
      })
    }
  })
  
  return links
}

/**
 * Extract images from HTML
 */
function extractImages($: cheerio.CheerioAPI, baseUrl: string): any[] {
  const images: any[] = []
  
  $('img[src]').each((_, el) => {
    const $el = $(el)
    const src = $el.attr('src')
    
    if (src) {
      const url = new URL(src, baseUrl).href
      
      images.push({
        url,
        alt: $el.attr('alt'),
        title: $el.attr('title'),
        width: parseInt($el.attr('width') || '0', 10) || undefined,
        height: parseInt($el.attr('height') || '0', 10) || undefined,
      })
    }
  })
  
  return images
}

/**
 * Extract metadata from HTML
 */
function extractMetadata($: cheerio.CheerioAPI, baseUrl: string): any {
  const getMeta = (name: string): string | undefined => {
    return $(`meta[name="${name}"]`).attr('content') ||
           $(`meta[property="${name}"]`).attr('content')
  }
  
  return {
    title: $('title').text().trim() || getMeta('og:title'),
    description: getMeta('description') || getMeta('og:description'),
    keywords: getMeta('keywords')?.split(',').map(k => k.trim()),
    author: getMeta('author'),
    publishDate: getMeta('article:published_time') || getMeta('date'),
    modifiedDate: getMeta('article:modified_time'),
    ogTitle: getMeta('og:title'),
    ogDescription: getMeta('og:description'),
    ogImage: getMeta('og:image'),
    ogUrl: getMeta('og:url'),
    ogType: getMeta('og:type'),
    twitterCard: getMeta('twitter:card'),
    twitterSite: getMeta('twitter:site'),
    twitterTitle: getMeta('twitter:title'),
    twitterDescription: getMeta('twitter:description'),
    twitterImage: getMeta('twitter:image'),
    canonicalUrl: $('link[rel="canonical"]').attr('href'),
    robots: getMeta('robots'),
    language: $('html').attr('lang'),
    favicon: $('link[rel="icon"]').attr('href') || '/favicon.ico',
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format web fetch output
 */
function formatWebFetchOutput(output: WebFetchOutput): string {
  const lines: string[] = []
  
  lines.push(`URL: ${output.url}`)
  
  if (output.finalUrl && output.finalUrl !== output.url) {
    lines.push(`Final URL: ${output.finalUrl}`)
  }
  
  if (output.status) {
    lines.push(`Status: ${output.status} ${output.statusText || ''}`)
  }
  
  lines.push(`Duration: ${output.duration}ms`)
  
  if (output.size) {
    lines.push(`Size: ${formatSize(output.size)}`)
  }
  
  lines.push('')
  
  if (output.markdown) {
    lines.push(output.markdown.slice(0, 2000))
    if (output.markdown.length > 2000) {
      lines.push('\n... (truncated)')
    }
  } else if (output.text) {
    lines.push(output.text.slice(0, 2000))
    if (output.text.length > 2000) {
      lines.push('\n... (truncated)')
    }
  } else if (output.json) {
    lines.push('```json')
    lines.push(JSON.stringify(output.json, null, 2).slice(0, 2000))
    lines.push('```')
  }
  
  if (output.links && output.links.length > 0) {
    lines.push(`\nLinks (${output.links.length}):`)
    output.links.slice(0, 10).forEach(link => {
      lines.push(`  - ${link.text || link.url}`)
    })
  }
  
  if (output.images && output.images.length > 0) {
    lines.push(`\nImages (${output.images.length}):`)
    output.images.slice(0, 5).forEach(img => {
      lines.push(`  - ${img.alt || img.url}`)
    })
  }
  
  if (output.metadata) {
    lines.push(`\nMetadata:`)
    if (output.metadata.title) lines.push(`  Title: ${output.metadata.title}`)
    if (output.metadata.description) lines.push(`  Description: ${output.metadata.description}`)
    if (output.metadata.author) lines.push(`  Author: ${output.metadata.author}`)
  }
  
  if (output.error) {
    lines.push(`Error: ${output.error}`)
  }
  
  return lines.join('\n')
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`
}

/**
 * WebFetchTool - Fetch web content
 */
export const WebFetchTool = buildTool({
  name: 'WebFetch',
  description: 'Fetch and extract content from web pages. Supports various content types and extraction modes including markdown conversion.',
  inputSchema: WebFetchInputSchema,
  outputSchema: WebFetchOutputSchema,
  
  call: async (input: WebFetchInput, context: any) => {
    const result = await executeWebFetch(input)
    return {
      ok: !result.error,
      output: result,
      display: formatWebFetchOutput(result),
    }
  },
  
  checkPermissions: async (input: WebFetchInput, context: any) => {
    // Web fetch is generally safe
    return { behavior: 'allow' }
  },
  
  validateInput: (input: unknown) => {
    return WebFetchInputSchema.safeParse(input)
  },
  
  getRiskLevel: (input: WebFetchInput) => {
    // Web fetch is read-only, but be cautious about what URLs are fetched
    return 'low'
  },
  
  getSummaryForPermission: (input: WebFetchInput) => {
    return `Fetch web content from: ${input.url}`
  },
})

// Export types
export { WebFetchInput, WebFetchOutput, WebFetchInputSchema, WebFetchOutputSchema, LinkSchema, ImageSchema, MetadataSchema }
export default WebFetchTool
