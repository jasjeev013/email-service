import { RateLimiter } from "../../src/utils/rateLimiter";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimiter = new RateLimiter(3, 10000); // 3 requests per 10 seconds
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow requests under limit", async () => {
    await rateLimiter.check(); // 1
    await rateLimiter.check(); // 2
    await rateLimiter.check(); // 3
    // All should resolve immediately
  });

  it("should delay requests over limit", async () => {
    // Mock setTimeout
    jest.spyOn(global, "setTimeout");

    // Fill the window
    await rateLimiter.check(); // 1
    await rateLimiter.check(); // 2
    await rateLimiter.check(); // 3

    // Fourth request should be delayed
    const checkPromise = rateLimiter.check();

    // Need to wait for the internal setTimeout
    await Promise.resolve();

    expect(setTimeout).toHaveBeenCalled();

    // Advance past the delay
    jest.runAllTimers();
    await expect(checkPromise).resolves.toBeUndefined();
  });

  it("should reset after window passes", async () => {
    // Fill the window
    await rateLimiter.check(); // 1
    await rateLimiter.check(); // 2
    await rateLimiter.check(); // 3

    // Advance past window
    jest.advanceTimersByTime(10001);

    // Should allow new requests
    await rateLimiter.check(); // 1 in new window
    await rateLimiter.check(); // 2 in new window
    await rateLimiter.check(); // 3 in new window
  });
});
