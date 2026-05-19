// [REQ-MESH_HARDENING]: Hardening tests — phase 29

import { describe, it, expect } from "vitest";
import {
  ConcurrencyLimiter,
  HardeningService,
  retryBackoffDelay,
} from "./hardening-service";

describe("HardeningService [IMPL-MESH_HARDENING]", () => {
  it("instantiates_with_default_config", () => {
    const svc = new HardeningService();
    expect(svc.getRetryDelay(2)).toBe(200);
    expect(svc.limiter).toBeDefined();
  });

  it("retry_backoff_increases_delay", () => {
    expect(retryBackoffDelay(1, 100)).toBe(100);
    expect(retryBackoffDelay(2, 100)).toBe(200);
    expect(retryBackoffDelay(3, 100)).toBe(400);
  });

  it("concurrency_limit_is_enforced", async () => {
    const limiter = new ConcurrencyLimiter(1);
    let concurrent = 0;
    let maxConcurrent = 0;
    const task = async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent--;
    };
    await Promise.all([limiter.run(task), limiter.run(task)]);
    expect(maxConcurrent).toBe(1);
  });
});
