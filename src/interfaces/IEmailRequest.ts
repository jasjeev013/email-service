export interface IEmailRequest {
  to: string;
  subject: string;
  body: string;
  idempotencyKey?: string;
}