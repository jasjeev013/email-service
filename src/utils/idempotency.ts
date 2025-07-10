export class IdempotencyTracker {
  private processedKeys: Set<string>;
  private ttl: number;

  constructor(ttlMinutes: number = 60) {
    this.processedKeys = new Set();
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  checkAndAdd(key: string): boolean {
    if (!key) return false; // No key means not idempotent
    
    if (this.processedKeys.has(key)) {
      return true; // Already processed
    }
    
    this.processedKeys.add(key);
    // Clean up after TTL
    setTimeout(() => this.processedKeys.delete(key), this.ttl);
    return false;
  }
}