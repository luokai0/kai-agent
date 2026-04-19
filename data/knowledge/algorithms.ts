/**
 * Algorithm Implementations - Core Algorithms for AI Processing
 * Part of Kai Agent's Neural Knowledge System
 */

// ============================================================================
// SORTING ALGORITHMS
// ============================================================================

export class SortingAlgorithms {
  // Quick Sort - O(n log n) average, O(n²) worst
  static quickSort<T>(arr: T[], compare: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0): T[] {
    if (arr.length <= 1) return arr;
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => compare(x, pivot) < 0);
    const middle = arr.filter(x => compare(x, pivot) === 0);
    const right = arr.filter(x => compare(x, pivot) > 0);
    
    return [...this.quickSort(left, compare), ...middle, ...this.quickSort(right, compare)];
  }
  
  // Merge Sort - O(n log n) always
  static mergeSort<T>(arr: T[], compare: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0): T[] {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid), compare);
    const right = this.mergeSort(arr.slice(mid), compare);
    
    return this.merge(left, right, compare);
  }
  
  private static merge<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
    const result: T[] = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
  }
  
  // Heap Sort - O(n log n)
  static heapSort<T>(arr: T[], compare: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0): T[] {
    const result = [...arr];
    const n = result.length;
    
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(result, n, i, compare);
    }
    
    // Extract elements from heap
    for (let i = n - 1; i > 0; i--) {
      [result[0], result[i]] = [result[i], result[0]];
      this.heapify(result, i, 0, compare);
    }
    
    return result;
  }
  
  private static heapify<T>(arr: T[], n: number, i: number, compare: (a: T, b: T) => number): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && compare(arr[left], arr[largest]) > 0) largest = left;
    if (right < n && compare(arr[right], arr[largest]) > 0) largest = right;
    
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this.heapify(arr, n, largest, compare);
    }
  }
  
  // Radix Sort - O(nk) where k is digit count
  static radixSort(arr: number[]): number[] {
    const max = Math.max(...arr);
    const result = [...arr];
    
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      this.countingSort(result, exp);
    }
    
    return result;
  }
  
  private static countingSort(arr: number[], exp: number): void {
    const n = arr.length;
    const output = new Array(n).fill(0);
    const count = new Array(10).fill(0);
    
    for (let i = 0; i < n; i++) {
      count[Math.floor(arr[i] / exp) % 10]++;
    }
    
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }
    
    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(arr[i] / exp) % 10;
      output[count[digit] - 1] = arr[i];
      count[digit]--;
    }
    
    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
    }
  }
}

// ============================================================================
// SEARCHING ALGORITHMS
// ============================================================================

export class SearchingAlgorithms {
  // Binary Search - O(log n)
  static binarySearch<T>(arr: T[], target: T, compare: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0): number {
    let left = 0, right = arr.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cmp = compare(arr[mid], target);
      
      if (cmp === 0) return mid;
      if (cmp < 0) left = mid + 1;
      else right = mid - 1;
    }
    
    return -1;
  }
  
  // Exponential Search - O(log n)
  static exponentialSearch<T>(arr: T[], target: T, compare: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0): number {
    if (arr.length === 0) return -1;
    if (compare(arr[0], target) === 0) return 0;
    
    let i = 1;
    while (i < arr.length && compare(arr[i], target) <= 0) {
      i *= 2;
    }
    
    return this.binarySearchRange(arr, target, Math.floor(i / 2), Math.min(i, arr.length - 1), compare);
  }
  
  private static binarySearchRange<T>(arr: T[], target: T, left: number, right: number, compare: (a: T, b: T) => number): number {
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cmp = compare(arr[mid], target);
      
      if (cmp === 0) return mid;
      if (cmp < 0) left = mid + 1;
      else right = mid - 1;
    }
    
    return -1;
  }
  
  // Interpolation Search - O(log log n) average
  static interpolationSearch(arr: number[], target: number): number {
    let left = 0, right = arr.length - 1;
    
    while (left <= right && target >= arr[left] && target <= arr[right]) {
      if (arr[left] === arr[right]) {
        if (arr[left] === target) return left;
        return -1;
      }
      
      const pos = left + Math.floor(((target - arr[left]) * (right - left)) / (arr[right] - arr[left]));
      
      if (arr[pos] === target) return pos;
      if (arr[pos] < target) left = pos + 1;
      else right = pos - 1;
    }
    
    return -1;
  }
  
  // Depth-First Search
  static dfs<T>(graph: Map<T, T[]>, start: T, visit: (node: T) => void): Set<T> {
    const visited = new Set<T>();
    const stack: T[] = [start];
    
    while (stack.length > 0) {
      const node = stack.pop()!;
      
      if (!visited.has(node)) {
        visited.add(node);
        visit(node);
        
        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }
    
    return visited;
  }
  
  // Breadth-First Search
  static bfs<T>(graph: Map<T, T[]>, start: T, visit: (node: T) => void): Set<T> {
    const visited = new Set<T>();
    const queue: T[] = [start];
    visited.add(start);
    
    while (queue.length > 0) {
      const node = queue.shift()!;
      visit(node);
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    return visited;
  }
  
  // A* Search Algorithm
  static aStar<T>(
    graph: Map<T, Map<T, number>>,
    start: T,
    goal: T,
    heuristic: (node: T) => number,
    equals: (a: T, b: T) => boolean = (a, b) => a === b
  ): T[] | null {
    const openSet = new Set<T>([start]);
    const cameFrom = new Map<T, T>();
    const gScore = new Map<T, number>();
    const fScore = new Map<T, number>();
    
    gScore.set(start, 0);
    fScore.set(start, heuristic(start));
    
    while (openSet.size > 0) {
      const current = this.getMinFScore(openSet, fScore);
      
      if (equals(current, goal)) {
        return this.reconstructPath(cameFrom, current);
      }
      
      openSet.delete(current);
      
      const neighbors = graph.get(current);
      if (neighbors) {
        for (const [neighbor, cost] of neighbors) {
          const tentativeG = (gScore.get(current) || Infinity) + cost;
          
          if (tentativeG < (gScore.get(neighbor) || Infinity)) {
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeG);
            fScore.set(neighbor, tentativeG + heuristic(neighbor));
            
            if (!openSet.has(neighbor)) {
              openSet.add(neighbor);
            }
          }
        }
      }
    }
    
    return null;
  }
  
  private static getMinFScore<T>(openSet: Set<T>, fScore: Map<T, number>): T {
    let minNode: T | null = null;
    let minScore = Infinity;
    
    for (const node of openSet) {
      const score = fScore.get(node) || Infinity;
      if (score < minScore) {
        minScore = score;
        minNode = node;
      }
    }
    
    return minNode!;
  }
  
  private static reconstructPath<T>(cameFrom: Map<T, T>, current: T): T[] {
    const path = [current];
    
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }
    
    return path;
  }
}

// ============================================================================
// GRAPH ALGORITHMS
// ============================================================================

export class GraphAlgorithms {
  // Dijkstra's Shortest Path
  static dijkstra<T>(graph: Map<T, Map<T, number>>, start: T): { distances: Map<T, number>, previous: Map<T, T | null> } {
    const distances = new Map<T, number>();
    const previous = new Map<T, T | null>();
    const unvisited = new Set<T>();
    
    // Initialize
    for (const node of graph.keys()) {
      distances.set(node, Infinity);
      previous.set(node, null);
      unvisited.add(node);
    }
    
    for (const [neighbor] of graph) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, Infinity);
        previous.set(neighbor, null);
        unvisited.add(neighbor);
      }
    }
    
    distances.set(start, 0);
    
    while (unvisited.size > 0) {
      const current = this.getMinDistanceNode(unvisited, distances);
      unvisited.delete(current);
      
      const neighbors = graph.get(current);
      if (neighbors) {
        for (const [neighbor, weight] of neighbors) {
          const alt = (distances.get(current) || Infinity) + weight;
          if (alt < (distances.get(neighbor) || Infinity)) {
            distances.set(neighbor, alt);
            previous.set(neighbor, current);
          }
        }
      }
    }
    
    return { distances, previous };
  }
  
  private static getMinDistanceNode<T>(unvisited: Set<T>, distances: Map<T, number>): T {
    let minNode: T | null = null;
    let minDistance = Infinity;
    
    for (const node of unvisited) {
      const dist = distances.get(node) || Infinity;
      if (dist < minDistance) {
        minDistance = dist;
        minNode = node;
      }
    }
    
    return minNode!;
  }
  
  // Bellman-Ford Algorithm (handles negative weights)
  static bellmanFord<T>(edges: Array<{ from: T; to: T; weight: number }>, vertices: T[], start: T): { distances: Map<T, number>, hasNegativeCycle: boolean } {
    const distances = new Map<T, number>();
    
    for (const v of vertices) {
      distances.set(v, Infinity);
    }
    distances.set(start, 0);
    
    for (let i = 0; i < vertices.length - 1; i++) {
      for (const { from, to, weight } of edges) {
        const fromDist = distances.get(from) ?? Infinity;
        const toDist = distances.get(to) ?? Infinity;
        if (fromDist + weight < toDist) {
          distances.set(to, fromDist + weight);
        }
      }
    }
    
    // Check for negative cycle
    let hasNegativeCycle = false;
    for (const { from, to, weight } of edges) {
      const fromDist = distances.get(from) ?? Infinity;
      const toDist = distances.get(to) ?? Infinity;
      if (fromDist + weight < toDist) {
        hasNegativeCycle = true;
        break;
      }
    }
    
    return { distances, hasNegativeCycle };
  }
  
  // Floyd-Warshall Algorithm (all pairs shortest path)
  static floydWarshall<T>(graph: Map<T, Map<T, number>>, vertices: T[]): Map<T, Map<T, number>> {
    const dist = new Map<T, Map<T, number>>();
    
    // Initialize distances
    for (const u of vertices) {
      dist.set(u, new Map());
      for (const v of vertices) {
        if (u === v) {
          dist.get(u)!.set(v, 0);
        } else if (graph.get(u)?.has(v)) {
          dist.get(u)!.set(v, graph.get(u)!.get(v)!);
        } else {
          dist.get(u)!.set(v, Infinity);
        }
      }
    }
    
    // Update distances
    for (const k of vertices) {
      for (const i of vertices) {
        for (const j of vertices) {
          const ikDist = dist.get(i)!.get(k)!;
          const kjDist = dist.get(k)!.get(j)!;
          const ijDist = dist.get(i)!.get(j)!;
          
          if (ikDist + kjDist < ijDist) {
            dist.get(i)!.set(j, ikDist + kjDist);
          }
        }
      }
    }
    
    return dist;
  }
  
  // Kruskal's Minimum Spanning Tree
  static kruskalMST<T>(edges: Array<{ from: T; to: T; weight: number }>, vertices: T[]): Array<{ from: T; to: T; weight: number }> {
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const parent = new Map<T, T>();
    const rank = new Map<T, number>();
    
    // Initialize Union-Find
    for (const v of vertices) {
      parent.set(v, v);
      rank.set(v, 0);
    }
    
    const find = (v: T): T => {
      if (parent.get(v) !== v) {
        parent.set(v, find(parent.get(v)!));
      }
      return parent.get(v)!;
    };
    
    const union = (u: T, v: T): boolean => {
      const rootU = find(u);
      const rootV = find(v);
      
      if (rootU === rootV) return false;
      
      const rankU = rank.get(rootU)!;
      const rankV = rank.get(rootV)!;
      
      if (rankU < rankV) {
        parent.set(rootU, rootV);
      } else if (rankU > rankV) {
        parent.set(rootV, rootU);
      } else {
        parent.set(rootV, rootU);
        rank.set(rootU, rankU + 1);
      }
      
      return true;
    };
    
    const mst: Array<{ from: T; to: T; weight: number }> = [];
    
    for (const edge of sortedEdges) {
      if (union(edge.from, edge.to)) {
        mst.push(edge);
        if (mst.length === vertices.length - 1) break;
      }
    }
    
    return mst;
  }
  
  // Topological Sort
  static topologicalSort<T>(graph: Map<T, T[]>): T[] | null {
    const inDegree = new Map<T, number>();
    const result: T[] = [];
    const queue: T[] = [];
    
    // Initialize in-degrees
    for (const [node] of graph) {
      if (!inDegree.has(node)) inDegree.set(node, 0);
    }
    
    for (const [, neighbors] of graph) {
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      }
    }
    
    // Add nodes with no incoming edges
    for (const [node, degree] of inDegree) {
      if (degree === 0) queue.push(node);
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }
    
    if (result.length !== inDegree.size) {
      return null; // Cycle detected
    }
    
    return result;
  }
  
  // Strongly Connected Components (Tarjan's Algorithm)
  static tarjanSCC<T>(graph: Map<T, T[]>): T[][] {
    let index = 0;
    const stack: T[] = [];
    const indices = new Map<T, number>();
    const lowLinks = new Map<T, number>();
    const onStack = new Set<T>();
    const sccs: T[][] = [];
    
    const strongConnect = (v: T) => {
      indices.set(v, index);
      lowLinks.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);
      
      const neighbors = graph.get(v) || [];
      for (const w of neighbors) {
        if (!indices.has(w)) {
          strongConnect(w);
          lowLinks.set(v, Math.min(lowLinks.get(v)!, lowLinks.get(w)!));
        } else if (onStack.has(w)) {
          lowLinks.set(v, Math.min(lowLinks.get(v)!, indices.get(w)!));
        }
      }
      
      if (lowLinks.get(v) === indices.get(v)) {
        const scc: T[] = [];
        let w: T;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        sccs.push(scc);
      }
    };
    
    for (const v of graph.keys()) {
      if (!indices.has(v)) {
        strongConnect(v);
      }
    }
    
    return sccs;
  }
}

// ============================================================================
// DYNAMIC PROGRAMMING
// ============================================================================

export class DynamicProgramming {
  // Longest Common Subsequence
  static lcs(a: string, b: string): string {
    const m = a.length, n = b.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // Backtrack to find LCS
    let lcs = '';
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        lcs = a[i - 1] + lcs;
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    
    return lcs;
  }
  
  // Longest Increasing Subsequence
  static lis(arr: number[]): number[] {
    if (arr.length === 0) return [];
    
    const dp: number[] = Array(arr.length).fill(1);
    const prev: number[] = Array(arr.length).fill(-1);
    
    for (let i = 1; i < arr.length; i++) {
      for (let j = 0; j < i; j++) {
        if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
          dp[i] = dp[j] + 1;
          prev[i] = j;
        }
      }
    }
    
    // Find max length and its index
    let maxLength = 0, maxIndex = 0;
    for (let i = 0; i < dp.length; i++) {
      if (dp[i] > maxLength) {
        maxLength = dp[i];
        maxIndex = i;
      }
    }
    
    // Reconstruct LIS
    const result: number[] = [];
    let i = maxIndex;
    while (i !== -1) {
      result.unshift(arr[i]);
      i = prev[i];
    }
    
    return result;
  }
  
  // Knapsack Problem (0/1)
  static knapsack(weights: number[], values: number[], capacity: number): { maxValue: number, items: number[] } {
    const n = weights.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= capacity; w++) {
        if (weights[i - 1] <= w) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - weights[i - 1]] + values[i - 1]
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    
    // Backtrack to find items
    const items: number[] = [];
    let w = capacity;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        items.push(i - 1);
        w -= weights[i - 1];
      }
    }
    
    return { maxValue: dp[n][capacity], items };
  }
  
  // Edit Distance (Levenshtein Distance)
  static editDistance(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    
    return dp[m][n];
  }
  
  // Coin Change
  static coinChange(coins: number[], amount: number): number {
    const dp: number[] = Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    
    for (let i = 1; i <= amount; i++) {
      for (const coin of coins) {
        if (coin <= i && dp[i - coin] !== Infinity) {
          dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
      }
    }
    
    return dp[amount] === Infinity ? -1 : dp[amount];
  }
  
  // Matrix Chain Multiplication
  static matrixChainOrder(dimensions: number[]): number {
    const n = dimensions.length - 1;
    const dp: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let len = 2; len <= n; len++) {
      for (let i = 0; i < n - len + 1; i++) {
        const j = i + len - 1;
        dp[i][j] = Infinity;
        
        for (let k = i; k < j; k++) {
          const cost = dp[i][k] + dp[k + 1][j] + dimensions[i] * dimensions[k + 1] * dimensions[j + 1];
          dp[i][j] = Math.min(dp[i][j], cost);
        }
      }
    }
    
    return dp[0][n - 1];
  }
  
  // Longest Palindromic Subsequence
  static longestPalindromicSubsequence(s: string): number {
    const n = s.length;
    const dp: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) dp[i][i] = 1;
    
    for (let len = 2; len <= n; len++) {
      for (let i = 0; i < n - len + 1; i++) {
        const j = i + len - 1;
        
        if (s[i] === s[j]) {
          dp[i][j] = dp[i + 1][j - 1] + 2;
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
        }
      }
    }
    
    return dp[0][n - 1];
  }
}

// ============================================================================
// STRING ALGORITHMS
// ============================================================================

export class StringAlgorithms {
  // Knuth-Morris-Pratt Pattern Matching
  static kmp(text: string, pattern: string): number[] {
    const result: number[] = [];
    const lps = this.computeLPS(pattern);
    
    let i = 0, j = 0;
    while (i < text.length) {
      if (text[i] === pattern[j]) {
        i++;
        j++;
        
        if (j === pattern.length) {
          result.push(i - j);
          j = lps[j - 1];
        }
      } else {
        if (j !== 0) {
          j = lps[j - 1];
        } else {
          i++;
        }
      }
    }
    
    return result;
  }
  
  private static computeLPS(pattern: string): number[] {
    const lps: number[] = Array(pattern.length).fill(0);
    let len = 0, i = 1;
    
    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }
    
    return lps;
  }
  
  // Rabin-Karp Algorithm
  static rabinKarp(text: string, pattern: string): number[] {
    const result: number[] = [];
    const d = 256; // Number of characters
    const q = 101; // Prime number for hashing
    const m = pattern.length;
    const n = text.length;
    const h = Math.pow(d, m - 1) % q;
    
    let p = 0, t = 0;
    
    // Calculate hash for pattern and first window
    for (let i = 0; i < m; i++) {
      p = (d * p + pattern.charCodeAt(i)) % q;
      t = (d * t + text.charCodeAt(i)) % q;
    }
    
    for (let i = 0; i <= n - m; i++) {
      if (p === t) {
        if (text.slice(i, i + m) === pattern) {
          result.push(i);
        }
      }
      
      if (i < n - m) {
        t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
        if (t < 0) t += q;
      }
    }
    
    return result;
  }
  
  // Z-Algorithm
  static zFunction(s: string): number[] {
    const n = s.length;
    const z: number[] = Array(n).fill(0);
    let l = 0, r = 0;
    
    for (let i = 1; i < n; i++) {
      if (i <= r) {
        z[i] = Math.min(r - i + 1, z[i - l]);
      }
      
      while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
        z[i]++;
      }
      
      if (i + z[i] - 1 > r) {
        l = i;
        r = i + z[i] - 1;
      }
    }
    
    return z;
  }
  
  // Suffix Array Construction
  static buildSuffixArray(s: string): number[] {
    const n = s.length;
    let sa: number[] = Array.from({ length: n }, (_, i) => i);
    let rank: number[] = s.split('').map(c => c.charCodeAt(0));
    let tmp: number[] = Array(n).fill(0);
    
    for (let k = 1; k < n; k *= 2) {
      const cmp = (a: number, b: number): number => {
        if (rank[a] !== rank[b]) return rank[a] - rank[b];
        const ra = a + k < n ? rank[a + k] : -1;
        const rb = b + k < n ? rank[b + k] : -1;
        return ra - rb;
      };
      
      sa.sort(cmp);
      
      tmp[sa[0]] = 0;
      for (let i = 1; i < n; i++) {
        tmp[sa[i]] = tmp[sa[i - 1]] + (cmp(sa[i - 1], sa[i]) < 0 ? 1 : 0);
      }
      
      [rank, tmp] = [tmp, rank];
    }
    
    return sa;
  }
  
  // Trie (Prefix Tree)
  static createTrie(): Trie {
    return {
      root: {},
      insert(word: string): void {
        let node = this.root;
        for (const char of word) {
          if (!node[char]) node[char] = {};
          node = node[char];
        }
        node['$'] = true;
      },
      search(word: string): boolean {
        let node = this.root;
        for (const char of word) {
          if (!node[char]) return false;
          node = node[char];
        }
        return node['$'] === true;
      },
      startsWith(prefix: string): boolean {
        let node = this.root;
        for (const char of prefix) {
          if (!node[char]) return false;
          node = node[char];
        }
        return true;
      }
    };
  }
}

interface Trie {
  root: Record<string, any>;
  insert(word: string): void;
  search(word: string): boolean;
  startsWith(prefix: string): boolean;
}

// ============================================================================
// NUMBER THEORY
// ============================================================================

export class NumberTheory {
  // GCD using Euclidean algorithm
  static gcd(a: number, b: number): number {
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return a;
  }
  
  // Extended GCD (returns gcd and Bezout coefficients)
  static extendedGcd(a: number, b: number): { gcd: number; x: number; y: number } {
    if (a === 0) return { gcd: b, x: 0, y: 1 };
    
    const { gcd, x: x1, y: y1 } = this.extendedGcd(b % a, a);
    const x = y1 - Math.floor(b / a) * x1;
    
    return { gcd, x, y: x1 };
  }
  
  // LCM
  static lcm(a: number, b: number): number {
    return (a * b) / this.gcd(a, b);
  }
  
  // Modular Exponentiation
  static modPow(base: number, exponent: number, modulus: number): number {
    if (modulus === 1) return 0;
    
    let result = 1;
    base = base % modulus;
    
    while (exponent > 0) {
      if (exponent % 2 === 1) {
        result = (result * base) % modulus;
      }
      exponent = Math.floor(exponent / 2);
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  // Miller-Rabin Primality Test
  static isPrime(n: number, k: number = 5): boolean {
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0) return false;
    
    let d = n - 1;
    let r = 0;
    while (d % 2 === 0) {
      d /= 2;
      r++;
    }
    
    const witness = (a: number): boolean => {
      let x = this.modPow(a, d, n);
      if (x === 1 || x === n - 1) return false;
      
      for (let i = 0; i < r - 1; i++) {
        x = this.modPow(x, 2, n);
        if (x === n - 1) return false;
      }
      
      return true;
    };
    
    for (let i = 0; i < k; i++) {
      const a = 2 + Math.floor(Math.random() * (n - 3));
      if (witness(a)) return false;
    }
    
    return true;
  }
  
  // Sieve of Eratosthenes
  static sieveOfEratosthenes(n: number): number[] {
    const isPrime = Array(n + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    
    for (let i = 2; i * i <= n; i++) {
      if (isPrime[i]) {
        for (let j = i * i; j <= n; j += i) {
          isPrime[j] = false;
        }
      }
    }
    
    const primes: number[] = [];
    for (let i = 2; i <= n; i++) {
      if (isPrime[i]) primes.push(i);
    }
    
    return primes;
  }
  
  // Pollard's Rho Factorization
  static pollardRho(n: number): number {
    if (n % 2 === 0) return 2;
    
    const f = (x: number): number => (x * x + 1) % n;
    
    let x = 2, y = 2, d = 1;
    
    while (d === 1) {
      x = f(x);
      y = f(f(y));
      d = this.gcd(Math.abs(x - y), n);
    }
    
    return d;
  }
  
  // Euler's Totient Function
  static eulerTotient(n: number): number {
    let result = n;
    
    for (let p = 2; p * p <= n; p++) {
      if (n % p === 0) {
        while (n % p === 0) n /= p;
        result -= result / p;
      }
    }
    
    if (n > 1) result -= result / n;
    
    return Math.floor(result);
  }
}

// Export all algorithm classes
export default {
  SortingAlgorithms,
  SearchingAlgorithms,
  GraphAlgorithms,
  DynamicProgramming,
  StringAlgorithms,
  NumberTheory
};