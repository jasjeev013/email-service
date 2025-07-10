import { EmailService } from "../src/EmailService";
import { MockProviderA } from "../src/providers/MockProviderA";
import { MockProviderB } from "../src/providers/MockProviderB";
import { IEmailRequest } from "../src/interfaces/IEmailRequest";
import { EmailStatus } from "../src/interfaces/IEmailResponse";

describe("EmailService", () => {
  let providerA: MockProviderA;
  let providerB: MockProviderB;
  let emailService: EmailService;
  const testRequest: IEmailRequest = {
    to: "test@example.com",
    subject: "Test Subject",
    body: "Test Body",
    idempotencyKey: "test-key",
  };

  beforeEach(() => {
    providerA = new MockProviderA(0.3);
    providerB = new MockProviderB(0.1);
    emailService = new EmailService(providerA, providerB, 10, 60000, 3, 1000);

    // Mock provider implementations
    jest.spyOn(providerA, "sendEmail").mockImplementation(async () => true);
    jest.spyOn(providerB, "sendEmail").mockImplementation(async () => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("sendEmail", () => {
    it("should successfully send email using primary provider", async () => {
      const result = await emailService.sendEmail(testRequest);

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe("MockProviderA");
      expect(result.status).toBe(EmailStatus.SENT);
      expect(providerA.sendEmail).toHaveBeenCalled();
      expect(providerB.sendEmail).not.toHaveBeenCalled();
    });

    it("should fallback to secondary provider when primary fails", async () => {
      jest
        .spyOn(providerA, "sendEmail")
        .mockRejectedValue(new Error("Primary failed"));

      const result = await emailService.sendEmail(testRequest);

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe("MockProviderB");
      expect(result.status).toBe(EmailStatus.SENT);
      expect(providerA.sendEmail).toHaveBeenCalled();
      expect(providerB.sendEmail).toHaveBeenCalled();
    });

    it("should apply rate limiting", async () => {
      const rateLimiterSpy = jest.spyOn(emailService["rateLimiter"], "check");

      await emailService.sendEmail(testRequest);

      expect(rateLimiterSpy).toHaveBeenCalled();
    });

    it("should track email status", async () => {
      const trackingId = "test-tracking";
      const requestWithTracking = {
        ...testRequest,
        idempotencyKey: trackingId,
      };

      const sendPromise = emailService.sendEmail(requestWithTracking);
      const initialStatus = emailService.getEmailStatus(trackingId);

      expect(initialStatus?.status).toBe(EmailStatus.PENDING);

      const result = await sendPromise;
      const finalStatus = emailService.getEmailStatus(trackingId);

      expect(finalStatus).toEqual(result);
    });
  });

  describe("trySendWithProvider", () => {
    it("should use circuit breaker for provider operations", async () => {
      const circuitBreakerExecuteSpy = jest.spyOn(
        emailService["circuitBreakers"].get("MockProviderA")!,
        "execute"
      );

      await emailService.sendEmail(testRequest);

      expect(circuitBreakerExecuteSpy).toHaveBeenCalled();
    });
  });

  describe("getCircuitBreakerStatus", () => {
    it("should return circuit breaker status for providers", () => {
      const statusA = emailService.getCircuitBreakerStatus("MockProviderA");
      const statusB = emailService.getCircuitBreakerStatus("MockProviderB");

      expect(statusA).toBeDefined();
      expect(statusB).toBeDefined();
      expect(statusA).toBe("CLOSED"); // Initial state
    });
  });
});
