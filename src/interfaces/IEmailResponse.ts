export interface IEmailResponse {
  success: boolean;
  message: string;
  providerUsed: string;
  retries: number;
  status: EmailStatus;
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RATE_LIMITED = 'RATE_LIMITED'
}