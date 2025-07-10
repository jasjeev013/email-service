import { MockProviderA } from '../../src/providers/MockProviderA';
import { IEmailRequest } from '../../src/interfaces/IEmailRequest';

describe('MockProviderA', () => {
  let provider: MockProviderA;
  const testRequest: IEmailRequest = {
    to: 'test@example.com',
    from: 'sender@example.com',
    subject: 'Test Subject',
    body: 'Test Body',
  };

  beforeEach(() => {
    provider = new MockProviderA();
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Avoid random failures in tests
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  it('should send email successfully', async () => {
    const response = await provider.sendEmail(testRequest);
    expect(response.success).toBe(true);
    expect(response.provider).toBe('MockProviderA');
  });

  it('should respect rate limiting', async () => {
    // First 5 requests should succeed (rate limit is 5 per second)
    for (let i = 0; i < 5; i++) {
      await expect(provider.sendEmail(testRequest)).resolves.toBeDefined();
    }

    // 6th request should fail
    await expect(provider.sendEmail(testRequest)).rejects.toThrow('MockProviderA rate limit exceeded');
  });

  it('should simulate random failures', async () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.1); // Will cause a failure
    await expect(provider.sendEmail(testRequest)).rejects.toThrow('MockProviderA failed to send email');
  });
});