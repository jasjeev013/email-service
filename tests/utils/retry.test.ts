import { withRetry } from "../../src/utils/retry";

describe("withRetry", () => {
  const successOperation = jest.fn().mockResolvedValue("success");
  const failingOperation = jest.fn().mockRejectedValue(new Error("Failed"));

  beforeEach(() => {
    jest.useFakeTimers();
    successOperation.mockClear();
    failingOperation.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should succeed on first attempt", async () => {
    const result = await withRetry(successOperation);
    expect(result).toBe("success");
    expect(successOperation).toHaveBeenCalledTimes(1);
  });

  it("should retry failed operations", async () => {
    failingOperation
      .mockImplementationOnce(() => Promise.reject(new Error("Failed once")))
      .mockResolvedValueOnce("success");

    const resultPromise = withRetry(failingOperation, 3, 1000);

    // First attempt fails immediately
    await Promise.resolve();
    expect(failingOperation).toHaveBeenCalledTimes(1);

    // Advance past first retry delay
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(failingOperation).toHaveBeenCalledTimes(2);

    await expect(resultPromise).resolves.toBe("success");
  });
});
