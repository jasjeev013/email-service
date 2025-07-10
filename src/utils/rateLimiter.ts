export class RateLimiter {
  private requests: number[];
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.requests = [];
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async check(): Promise<void> {
    const now = Date.now();
    // Remove old requests
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitTime = this.windowMs - (now - oldest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.check(); // Recursively check again after waiting
    }

    this.requests.push(now);
  }
}