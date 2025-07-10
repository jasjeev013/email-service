import { EmailService } from "../src/EmailService";
import { MockProviderA } from "../src/providers/MockProviderA";
import { MockProviderB } from "../src/providers/MockProviderB";
import { EmailStatus } from "../src/interfaces/IEmailResponse";

describe("EmailService", () => {
  let providerA: MockProviderA;
  let providerB: MockProviderB;
  let emailService: EmailService;

  beforeEach(() => {
    // Create providers with 0% failure rate for predictable tests
    providerA = new MockProviderA(0);
    providerB = new MockProviderB(0);
    emailService = new EmailService(providerA, providerB, 10, 1000, 3, 100);
  });

  it("should send email successfully with primary provider", async () => {
    const result = await emailService.sendEmail({
      to: "test@example.com",
      subject: "Test",
      body: "Test body"
    });

    expect(result.success).toBe(true);
    expect(result.providerUsed).toBe("MockProviderA");
    expect(result.retries).toBe(0);
    expect(result.status).toBe(EmailStatus.SENT);
  });

  it("should fall back to secondary provider when primary fails", async () => {
    // Make providerA fail
    jest.spyOn(providerA, "sendEmail").mockRejectedValue(new Error("Failed"));

    const result = await emailService.sendEmail({
      to: "test@example.com",
      subject: "Test",
      body: "Test body"
    });

    expect(result.success).toBe(true);
    expect(result.providerUsed).toBe("MockProviderB");
    expect(result.status).toBe(EmailStatus.SENT);
  });

  it("should respect idempotency keys", async () => {
    const request = {
      to: "test@example.com",
      subject: "Test",
      body: "Test body",
      idempotencyKey: "12345"
    };

    const firstResult = await emailService.sendEmail(request);
    const secondResult = await emailService.sendEmail(request);

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);
    expect(secondResult.message).toContain("Duplicate request detected");
  });

  it("should track email status", async () => {
    const request = {
      to: "test@example.com",
      subject: "Test",
      body: "Test body",
      idempotencyKey: "status-test"
    };

    await emailService.sendEmail(request);
    const status = emailService.getEmailStatus("status-test");

    expect(status).toBeDefined();
    expect(status?.success).toBe(true);
    expect(status?.status).toBe(EmailStatus.SENT);
  });

  it("should implement rate limiting", async () => {
    // Set very restrictive rate limiting (1 request per second)
    const rateLimitedService = new EmailService(providerA, providerB, 1, 1000);

    const startTime = Date.now();
    await rateLimitedService.sendEmail({
      to: "test1@example.com",
      subject: "Test 1",
      body: "Test body 1"
    });
    
    await rateLimitedService.sendEmail({
      to: "test2@example.com",
      subject: "Test 2",
      body: "Test body 2"
    });
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  });
});