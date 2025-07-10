export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  getProviderName(): string;
}