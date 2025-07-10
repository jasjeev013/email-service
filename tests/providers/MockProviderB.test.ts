import { IEmailRequest } from '../../src/interfaces/IEmailRequest';
import { MockProviderB } from '../../src/providers/MockProviderB';


describe('MockProviderB', () => {
  let provider: MockProviderB;
  const testRequest: IEmailRequest = {
    to: 'test@example.com',
    from: 'sender@example.com',
    subject: 'Test Subject',
    body: 'Test Body',
  };

  beforeEach(() => {
    provider = new MockProviderB();
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Avoid random failures in tests
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  it('should send email successfully', async () => {
    const response = await provider.sendEmail(testRequest);
    expect(response.success).toBe(true);
    expect(response.provider).toBe('MockProviderB');
  });

  it('should respect rate limiting', async () => {
    // First 3 requests should succeed (rate limit is 3 per second)
    for (let i = 0; i < 3; i++) {
      await expect(provider.sendEmail(testRequest)).resolves.toBeDefined();
    }

    // 4th request should fail
    await expect(provider.sendEmail(testRequest)).rejects.toThrow('MockProviderB rate limit exceeded');
  });

  it('should simulate random failures', async () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.05); // Will cause a failure
    await expect(provider.sendEmail(testRequest)).rejects.toThrow('MockProviderB failed to send email');
  });
});