// [IMPL-MESH_HARDENING] [REQ-MESH_HARDENING] [REQ-MESH_PLATFORM]: Concurrency and retry limits — phase 29

export type HardeningConfig = {
  maxConcurrentOperations: number;
  maxBandwidthBytesPerSecond?: number;
  retryBaseDelayMs: number;
};

export const DEFAULT_HARDENING: HardeningConfig = {
  maxConcurrentOperations: 4,
  retryBaseDelayMs: 100,
};

export class ConcurrencyLimiter {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

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

  /** Pace outbound-ish bytes after connector operations ([REQ-MESH_HARDENING], prompts phase 29 bandwidth_limits). */
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
