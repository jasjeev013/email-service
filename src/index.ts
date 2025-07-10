import { EmailService } from "./EmailService";
import { MockProviderA } from "./providers/MockProviderA";
import { MockProviderB } from "./providers/MockProviderB";

async function main() {
  // Create mock providers with different failure rates
  const providerA = new MockProviderA(0.3); // 30% failure rate
  const providerB = new MockProviderB(0.1); // 10% failure rate

  // Create email service with rate limiting (5 requests per 10 seconds for demo)
  const emailService = new EmailService(providerA, providerB, 5, 10000, 3, 1000);

  // Send some emails
  const emails = [
    { to: "user1@example.com", subject: "Welcome", body: "Welcome to our service!" },
    { to: "user2@example.com", subject: "Notification", body: "You have a new notification" },
    { to: "user3@example.com", subject: "Promotion", body: "Special offer just for you!" },
    { to: "user4@example.com", subject: "Reminder", body: "Don't forget about our meeting" },
    { to: "user5@example.com", subject: "Account", body: "Your account summary" },
    { to: "user6@example.com", subject: "Alert", body: "Important security alert" },
  ];

  for (const email of emails) {
    try {
      console.log(`\nSending email to ${email.to}...`);
      const result = await emailService.sendEmail({
        ...email,
        idempotencyKey: `${email.to}-${email.subject}`
      });
      
      console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
      console.log(`Provider: ${result.providerUsed}`);
      console.log(`Retries: ${result.retries}`);
      console.log(`Status: ${result.status}`);
      console.log(`Message: ${result.message}`);

    } catch (error) {
      console.error(`Failed to send email to ${email.to}:`, error instanceof Error ? error.message : error);
    }
  }

  // Check circuit breaker status
  console.log("\nCircuit Breaker Status:");
  console.log(`Provider A: ${emailService.getCircuitBreakerStatus("MockProviderA")}`);
  console.log(`Provider B: ${emailService.getCircuitBreakerStatus("MockProviderB")}`);

  process.exit(0);
}

main().catch(console.error);