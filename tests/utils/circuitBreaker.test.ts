import { CircuitBreaker } from "../../src/utils/circuitBreaker";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;
  const successOperation = jest.fn().mockResolvedValue("success");
  const failingOperation = jest.fn().mockRejectedValue(new Error("Failed"));

  beforeEach(() => {
    jest.useFakeTimers();
    circuitBreaker = new CircuitBreaker(3, 10000, 5000);
    successOperation.mockClear();
    failingOperation.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initially be in CLOSED state", () => {
    expect(circuitBreaker.getStatus()).toBe("CLOSED");
  });

  it("should execute successful operation", async () => {
    const result = await circuitBreaker.execute(successOperation);
    expect(result).toBe("success");
    expect(successOperation).toHaveBeenCalled();
    expect(circuitBreaker.getStatus()).toBe("CLOSED");
  });

  it("should transition to OPEN state after threshold failures", async () => {
    // First failure
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
      "Failed"
    );
    expect(circuitBreaker.getStatus()).toBe("CLOSED");

    // Second failure
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
      "Failed"
    );
    expect(circuitBreaker.getStatus()).toBe("CLOSED");

    // Third failure - should open
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
      "Failed"
    );
    expect(circuitBreaker.getStatus()).toBe("OPEN");
  });

  it("should reject operations when OPEN", async () => {
    // Force OPEN state
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        "Failed"
      );
    }

    await expect(circuitBreaker.execute(successOperation)).rejects.toThrow(
      "Circuit breaker is OPEN"
    );
  });

  it("should transition to HALF_OPEN after reset timeout", async () => {
    // Force OPEN state
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        "Failed"
      );
    }

    // Advance time past reset timeout
    jest.advanceTimersByTime(10001);

    // Need to attempt an operation to trigger state change
    const halfOpenPromise = circuitBreaker.execute(successOperation);
    expect(circuitBreaker.getStatus()).toBe("HALF_OPEN");

    // Clean up
    await Promise.resolve();
  });

  it("should transition back to CLOSED if HALF_OPEN succeeds", async () => {
    // Force OPEN then HALF_OPEN
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        "Failed"
      );
    }
    jest.advanceTimersByTime(10001);

    // Successful operation in HALF_OPEN
    await circuitBreaker.execute(successOperation);

    expect(circuitBreaker.getStatus()).toBe("CLOSED");
  });

  it("should transition back to OPEN if HALF_OPEN fails", async () => {
    // Force OPEN then HALF_OPEN
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
        "Failed"
      );
    }
    jest.advanceTimersByTime(10001);

    // Failed operation in HALF_OPEN
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
      "Failed"
    );

    expect(circuitBreaker.getStatus()).toBe("OPEN");
  });
});
