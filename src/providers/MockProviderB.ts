import { IEmailProvider } from "../interfaces/IEmailProvider";

export class MockProviderB implements IEmailProvider {
  private failRate: number;

  constructor(failRate: number = 0.1) {
    this.failRate = failRate;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Simulate random failures based on failRate
    const shouldFail = Math.random() < this.failRate;
    
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300)); // Simulate network delay
    
    if (shouldFail) {
      throw new Error(`MockProviderB failed to send email to ${to}`);
    }
    
    console.log(`[MockProviderB] Email sent to ${to} with subject "${subject}"`);
    return true;
  }

  getProviderName(): string {
    return "MockProviderB";
  }
}