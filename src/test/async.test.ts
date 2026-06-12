import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "@/lib/async";

describe("withTimeout", () => {
  it("returns completed operations", async () => {
    await expect(withTimeout(Promise.resolve("done"), 100)).resolves.toBe("done");
  });

  it("rejects stalled operations with a retryable message", async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<never>(() => undefined), 100);
    const assertion = expect(result).rejects.toThrow("request timed out");

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    vi.useRealTimers();
  });
});
