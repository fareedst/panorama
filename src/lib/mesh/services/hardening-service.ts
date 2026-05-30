// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING] [REQ-MESH_PLATFORM]: Concurrency limiter, exponential retry delay helper, optional outbound bandwidth pacing; optimistic configurationVersion enforced via mesh-record and MeshService.

export type HardeningConfig = {
  maxConcurrentOperations: number;
  maxBandwidthBytesPerSecond?: number;
  retryBaseDelayMs: number;
};

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — default maxConcurrentOperations=4 and retryBaseDelayMs=100; optional maxBandwidthBytesPerSecond for pacing.
export const DEFAULT_HARDENING: HardeningConfig = {
  maxConcurrentOperations: 4,
  retryBaseDelayMs: 100,
};

export class ConcurrencyLimiter {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  // [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — queue tasks when active count reaches max; release slot in finally and dequeue next waiter.
  async run<T>(fn: () => Promise<T> | T): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}

// [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — exponential backoff baseMs * 2^(attempt-1) for attempt ≥ 1.
export function retryBackoffDelay(attempt: number, baseMs: number): number {
  return baseMs * Math.pow(2, attempt - 1);
}

export class HardeningService {
  readonly limiter: ConcurrencyLimiter;

  constructor(private readonly config: HardeningConfig = DEFAULT_HARDENING) {
    this.limiter = new ConcurrencyLimiter(this.config.maxConcurrentOperations);
  }

  getRetryDelay(attempt: number): number {
    return retryBackoffDelay(attempt, this.config.retryBaseDelayMs);
  }

  /** [IMPL-MESH_HARDENING] [ARCH-MESH_LAYERED] [REQ-MESH_HARDENING]: how — after successful copy/update, sleep ceil(bytes/bps*1000) ms when bandwidth cap configured. */
  async throttleOutboundBytes(approxByteCount: number): Promise<void> {
    const bps = this.config.maxBandwidthBytesPerSecond;
    if (!bps || bps <= 0 || approxByteCount <= 0) {
      return;
    }
    const ms = Math.ceil((approxByteCount / bps) * 1000);
    if (ms <= 0) return;
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
