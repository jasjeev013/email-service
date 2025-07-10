export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenTimeout: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    failureThreshold: number = 3,
    resetTimeout: number = 10000,
    halfOpenTimeout: number = 5000
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.halfOpenTimeout = halfOpenTimeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        // After halfOpenTimeout, if no new failures, go back to CLOSED
        setTimeout(() => {
          if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            this.failureCount = 0;
          }
        }, this.halfOpenTimeout);
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      if (this.state === 'HALF_OPEN') {
        this.failureCount = 0;
        this.state = 'CLOSED';
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
      } else if (this.state === 'HALF_OPEN') {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }

  getStatus(): string {
    return this.state;
  }
}