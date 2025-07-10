import { IdempotencyTracker } from '../../src/utils/idempotency';

describe('IdempotencyTracker', () => {
  let tracker: IdempotencyTracker;

  beforeEach(() => {
    jest.useFakeTimers();
    tracker = new IdempotencyTracker(60); // 60 minute TTL
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return false for new keys', () => {
    expect(tracker.checkAndAdd('key1')).toBe(false);
    expect(tracker.checkAndAdd('key2')).toBe(false);
  });

  it('should return true for duplicate keys', () => {
    tracker.checkAndAdd('key1');
    expect(tracker.checkAndAdd('key1')).toBe(true);
  });

  it('should handle empty key as non-idempotent', () => {
    expect(tracker.checkAndAdd('')).toBe(false);
    expect(tracker.checkAndAdd('')).toBe(false);
  });

  it('should clear keys after TTL', () => {
    tracker.checkAndAdd('key1');
    
    // Advance time just before TTL
    jest.advanceTimersByTime(59 * 60 * 1000);
    expect(tracker.checkAndAdd('key1')).toBe(true);
    
    // Advance past TTL
    jest.advanceTimersByTime(2 * 60 * 1000);
    expect(tracker.checkAndAdd('key1')).toBe(false);
  });
});