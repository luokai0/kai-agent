/**
 * Working Memory - Short-term active memory
 * 
 * Manages active information during task execution.
 * Implements attention and focus mechanisms.
 */

import { EventEmitter } from 'events'

// Working memory item
interface WorkingItem {
  id: string
  content: string
  type: 'goal' | 'context' | 'current' | 'result' | 'constraint'
  priority: number
  createdAt: number
  updatedAt: number
  expiresAt?: number
  metadata?: Record<string, any>
}

// Attention slot
interface AttentionSlot {
  id: string
  item: WorkingItem | null
  focus: number
}

/**
 * Working Memory System
 */
export class WorkingMemory extends EventEmitter {
  private items: Map<string, WorkingItem> = new Map()
  private attentionSlots: AttentionSlot[] = []
  private focusItem: string | null = null
  private maxSlots: number = 7 // Miller's magic number
  private capacity: number = 20
  
  constructor() {
    super()
    
    // Initialize attention slots
    for (let i = 0; i < this.maxSlots; i++) {
      this.attentionSlots.push({
        id: `slot_${i}`,
        item: null,
        focus: 0,
      })
    }
  }
  
  /**
   * Add item to working memory
   */
  add(
    content: string,
    type: WorkingItem['type'] = 'current',
    options: {
      priority?: number
      ttl?: number
      metadata?: Record<string, any>
    } = {}
  ): WorkingItem {
    const id = `work_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    
    const item: WorkingItem = {
      id,
      content,
      type,
      priority: options.priority ?? 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: options.ttl ? Date.now() + options.ttl : undefined,
      metadata: options.metadata,
    }
    
    // Check capacity
    if (this.items.size >= this.capacity) {
      this.evict()
    }
    
    this.items.set(id, item)
    
    // Update attention
    this.updateAttention(item)
    
    this.emit('added', item)
    
    return item
  }
  
  /**
   * Update attention slots
   */
  private updateAttention(item: WorkingItem): void {
    // Find slot with lowest focus
    let minSlot = this.attentionSlots[0]
    for (const slot of this.attentionSlots) {
      if (!slot.item) {
        minSlot = slot
        break
      }
      if (slot.focus < minSlot.focus) {
        minSlot = slot
      }
    }
    
    // Replace or add to slot
    minSlot.item = item
    minSlot.focus = item.priority
  }
  
  /**
   * Get current focus
   */
  getFocus(): WorkingItem | null {
    if (!this.focusItem) {
      // Auto-select highest priority
      const sorted = Array.from(this.items.values())
        .sort((a, b) => b.priority - a.priority)
      
      if (sorted.length > 0) {
        this.focusItem = sorted[0].id
        return sorted[0]
      }
      return null
    }
    
    return this.items.get(this.focusItem) || null
  }
  
  /**
   * Set focus to item
   */
  setFocus(id: string): boolean {
    if (this.items.has(id)) {
      this.focusItem = id
      this.emit('focus', id)
      return true
    }
    return false
  }
  
  /**
   * Get all items of type
   */
  getByType(type: WorkingItem['type']): WorkingItem[] {
    return Array.from(this.items.values())
      .filter(item => item.type === type)
      .sort((a, b) => b.priority - a.priority)
  }
  
  /**
   * Get current context
   */
  getContext(): {
    goals: WorkingItem[]
    constraints: WorkingItem[]
    current: WorkingItem[]
    results: WorkingItem[]
  } {
    return {
      goals: this.getByType('goal'),
      constraints: this.getByType('constraint'),
      current: this.getByType('current'),
      results: this.getByType('result'),
    }
  }
  
  /**
   * Update item
   */
  update(id: string, updates: Partial<WorkingItem>): boolean {
    const item = this.items.get(id)
    if (!item) return false
    
    Object.assign(item, updates, { updatedAt: Date.now() })
    this.emit('updated', item)
    return true
  }
  
  /**
   * Remove item
   */
  remove(id: string): boolean {
    const removed = this.items.delete(id)
    
    if (removed) {
      // Clear from attention slots
      for (const slot of this.attentionSlots) {
        if (slot.item?.id === id) {
          slot.item = null
          slot.focus = 0
        }
      }
      
      if (this.focusItem === id) {
        this.focusItem = null
      }
      
      this.emit('removed', id)
    }
    
    return removed
  }
  
  /**
   * Evict least important items
   */
  private evict(): void {
    const items = Array.from(this.items.values())
      .sort((a, b) => a.priority - b.priority)
    
    // Remove bottom 20%
    const removeCount = Math.ceil(this.capacity * 0.2)
    
    for (let i = 0; i < removeCount && i < items.length; i++) {
      this.remove(items[i].id)
    }
  }
  
  /**
   * Clear expired items
   */
  clearExpired(): number {
    const now = Date.now()
    let cleared = 0
    
    for (const [id, item] of this.items) {
      if (item.expiresAt && now > item.expiresAt) {
        this.remove(id)
        cleared++
      }
    }
    
    return cleared
  }
  
  /**
   * Clear all items
   */
  clear(): void {
    this.items.clear()
    this.focusItem = null
    
    for (const slot of this.attentionSlots) {
      slot.item = null
      slot.focus = 0
    }
    
    this.emit('cleared')
  }
  
  /**
   * Get statistics
   */
  stats(): {
    count: number
    capacity: number
    focusedSlots: number
    byType: Record<string, number>
  } {
    const byType: Record<string, number> = {}
    
    for (const item of this.items.values()) {
      byType[item.type] = (byType[item.type] || 0) + 1
    }
    
    const focusedSlots = this.attentionSlots.filter(s => s.item !== null).length
    
    return {
      count: this.items.size,
      capacity: this.capacity,
      focusedSlots,
      byType,
    }
  }
  
  /**
   * Serialize for persistence
   */
  serialize(): { items: WorkingItem[]; focus: string | null } {
    return {
      items: Array.from(this.items.values()),
      focus: this.focusItem,
    }
  }
  
  /**
   * Deserialize from persistence
   */
  deserialize(data: { items: WorkingItem[]; focus: string | null }): void {
    this.clear()
    
    for (const item of data.items) {
      this.items.set(item.id, item)
    }
    
    if (data.focus) {
      this.focusItem = data.focus
    }
  }
}

export default WorkingMemory
