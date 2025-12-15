import crypto from "crypto";

interface AccurateCredentials {
  apiToken: string;
  signatureSecret: string;
  host?: string;
}

interface AccurateFetchOptions extends RequestInit {
  method?: string;
  body?: any;
}

/**
 * Build Accurate API headers with HMAC-SHA256 signature
 */
export function buildAccurateHeaders(
  apiToken: string,
  signatureSecret: string
): Record<string, string> {
  // Generate ISO timestamp
  const timestamp = new Date().toISOString();

  // Create HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", signatureSecret)
    .update(timestamp)
    .digest("base64");

  return {
    Authorization: `Bearer ${apiToken}`,
    "X-Api-Timestamp": timestamp,
    "X-Api-Signature": signature,
    "X-Language-Profile": "US",
    "Content-Type": "application/json",
  };
}

/**
 * Resolve Accurate host from API token
 */
export async function resolveHost(apiToken: string): Promise<string> {
  const response = await fetch("https://account.accurate.id/api/api-token.do", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "api_token",
      api_token: apiToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve host: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.sp?.webApiUrl) {
    throw new Error("Host URL not found in response");
  }

  return data.sp.webApiUrl; // e.g., https://zeus.accurate.id
}

/**
 * Rate limiter for Accurate API (8 req/sec, 8 concurrent)
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private activeRequests = 0;
  private maxConcurrent = 8;
  private requestsPerSecond = 8;
  private lastRequestTime = 0;
  private minInterval: number;

  constructor() {
    this.minInterval = 1000 / this.requestsPerSecond;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (
          this.activeRequests < this.maxConcurrent &&
          timeSinceLastRequest >= this.minInterval
        ) {
          this.activeRequests++;
          this.lastRequestTime = now;
          resolve();
        } else {
          const waitTime = Math.max(
            0,
            this.minInterval - timeSinceLastRequest
          );
          setTimeout(tryAcquire, waitTime);
        }
      };

      if (this.activeRequests >= this.maxConcurrent) {
        this.queue.push(tryAcquire);
      } else {
        tryAcquire();
      }
    });
  }

  release(): void {
    this.activeRequests--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const rateLimiter = new RateLimiter();

/**
 * Wrapper for Accurate API fetch with rate limiting
 */
export async function accurateFetch<T = any>(
  path: string,
  credentials: AccurateCredentials,
  options: AccurateFetchOptions = {}
): Promise<T> {
  if (!credentials.host) {
    throw new Error("Host is required. Call resolveHost first.");
  }

  await rateLimiter.acquire();

  try {
    const url = `${credentials.host}/accurate${path}`;
    const headers = buildAccurateHeaders(
      credentials.apiToken,
      credentials.signatureSecret
    );

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Accurate API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    // Check for Accurate-specific error responses
    if (data.r && !data.s) {
      throw new Error(data.r);
    }

    return data;
  } finally {
    rateLimiter.release();
  }
}
