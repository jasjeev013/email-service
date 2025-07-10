import { IEmailProvider } from "../interfaces/IEmailProvider";

export class MockProviderA implements IEmailProvider {
  private failRate: number;

  constructor(failRate: number = 0.2) {
    this.failRate = failRate;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Simulate random failures based on failRate
    const shouldFail = Math.random() < this.failRate;
    
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200)); // Simulate network delay
    
    if (shouldFail) {
      throw new Error(`MockProviderA failed to send email to ${to}`);
    }
    
    console.log(`[MockProviderA] Email sent to ${to} with subject "${subject} and body "${body}"`);
    return true;
  }

  getProviderName(): string {
    return "MockProviderA";
  }
}