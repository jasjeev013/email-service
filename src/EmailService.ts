import { IEmailProvider } from "./interfaces/IEmailProvider";
import { IEmailRequest } from "./interfaces/IEmailRequest";
import { IEmailResponse, EmailStatus } from "./interfaces/IEmailResponse";
import { withRetry } from "./utils/retry";
import { RateLimiter } from "./utils/rateLimiter";
import { IdempotencyTracker } from "./utils/idempotency";
import { CircuitBreaker } from "./utils/circuitBreaker";

export class EmailService {
  private primaryProvider: IEmailProvider;
  private secondaryProvider: IEmailProvider;
  private rateLimiter: RateLimiter;
  private idempotencyTracker: IdempotencyTracker;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private statusTracking: Map<string, IEmailResponse>;
  private maxRetries: number;
  private baseRetryDelay: number;

  constructor(
    primaryProvider: IEmailProvider,
    secondaryProvider: IEmailProvider,
    maxRequests: number = 10,
    windowMs: number = 60000, // 1 minute
    maxRetries: number = 3,
    baseRetryDelay: number = 1000
  ) {
    this.primaryProvider = primaryProvider;
    this.secondaryProvider = secondaryProvider;
    this.rateLimiter = new RateLimiter(maxRequests, windowMs);
    this.idempotencyTracker = new IdempotencyTracker();
    this.circuitBreakers = new Map([
      [primaryProvider.getProviderName(), new CircuitBreaker()],
      [secondaryProvider.getProviderName(), new CircuitBreaker()],
    ]);
    this.statusTracking = new Map();
    this.maxRetries = maxRetries;
    this.baseRetryDelay = baseRetryDelay;
  }

  public async sendEmail(request: IEmailRequest): Promise<IEmailResponse> {
    const { to, subject, body, idempotencyKey } = request;
    const trackingId = idempotencyKey || `${to}-${Date.now()}`;

    // Check for duplicate request
    if (this.idempotencyTracker.checkAndAdd(trackingId)) {
      const existingStatus = this.statusTracking.get(trackingId);
      if (existingStatus) {
        return existingStatus;
      }
      return {
        success: false,
        message: "Duplicate request detected",
        providerUsed: "",
        retries: 0,
        status: EmailStatus.FAILED,
      };
    }

    // Initialize tracking
    const initialResponse: IEmailResponse = {
      success: false,
      message: "Pending",
      providerUsed: "",
      retries: 0,
      status: EmailStatus.PENDING,
    };
    this.statusTracking.set(trackingId, initialResponse);

    try {
      // Apply rate limiting
      await this.rateLimiter.check();

      // Try primary provider first with retry and circuit breaker
      let result = await this.trySendWithProvider(
        this.primaryProvider,
        to,
        subject,
        body,
        trackingId
      );

      // If primary fails, try secondary provider
      if (!result.success) {
        result = await this.trySendWithProvider(
          this.secondaryProvider,
          to,
          subject,
          body,
          trackingId
        );
      }

      // Update final status
      this.statusTracking.set(trackingId, result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unknown error occurred";

      const errorResponse: IEmailResponse = {
        success: false,
        message: errorMessage,
        providerUsed: "",
        retries: this.maxRetries,
        status: EmailStatus.FAILED,
      };
      this.statusTracking.set(trackingId, errorResponse);
      return errorResponse;
    }
  }

  private async trySendWithProvider(
    provider: IEmailProvider,
    to: string,
    subject: string,
    body: string,
    trackingId: string
  ): Promise<IEmailResponse> {
    const providerName = provider.getProviderName();
    const circuitBreaker = this.circuitBreakers.get(providerName)!;
    let retries = 0;
    let lastError: Error | null = null;

    try {
      // Use circuit breaker to execute the operation
      const success = await circuitBreaker.execute(async () => {
        try {
          return await withRetry(
            async () => {
              retries++;
              return await provider.sendEmail(to, subject, body);
            },
            this.maxRetries,
            this.baseRetryDelay
          );
        } catch (error) {
          lastError = error as Error;
          throw error;
        }
      });

      return {
        success,
        message: success
          ? "Email sent successfully"
          : `Failed after ${retries} attempts`,
        providerUsed: providerName,
        retries: retries - 1, // Subtract 1 since the first attempt isn't a retry
        status: success ? EmailStatus.SENT : EmailStatus.FAILED,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unknown error occurred";
      return {
        success: false,
        message: errorMessage || `Failed to send email via ${providerName}`,
        providerUsed: providerName,
        retries: retries - 1,
        status:
          circuitBreaker.getStatus() === "OPEN"
            ? EmailStatus.FAILED
            : EmailStatus.FAILED,
      };
    }
  }

  public getEmailStatus(trackingId: string): IEmailResponse | undefined {
    return this.statusTracking.get(trackingId);
  }

  public getCircuitBreakerStatus(providerName: string): string | undefined {
    return this.circuitBreakers.get(providerName)?.getStatus();
  }
}
