import { MockProviderA } from '../../src/providers/MockProviderA';

describe('MockProviderA', () => {
  let provider: MockProviderA;

  beforeEach(() => {
    provider = new MockProviderA(0.3); // 30% failure rate
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Control random for consistent tests
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  describe('sendEmail', () => {
    it('should successfully send email when not failing', async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.8); // Above fail rate
      const consoleSpy = jest.spyOn(console, 'log');
      
      const result = await provider.sendEmail('test@example.com', 'Test', 'Body');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockProviderA] Email sent to test@example.com')
      );
    });

    it('should fail to send email based on fail rate', async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.1); // Below fail rate
      
      await expect(provider.sendEmail('test@example.com', 'Test', 'Body'))
        .rejects.toThrow('MockProviderA failed to send email to test@example.com');
    });

    it('should simulate network delay', async () => {
      jest.useFakeTimers();
      const sendPromise = provider.sendEmail('test@example.com', 'Test', 'Body');
      
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Allow any pending promises to resolve
      expect(sendPromise).not.toBeNull(); // Still pending
      
      jest.advanceTimersByTime(200);
      await expect(sendPromise).resolves.toBeDefined();
      jest.useRealTimers();
    });
  });

  describe('getProviderName', () => {
    it('should return correct provider name', () => {
      expect(provider.getProviderName()).toBe('MockProviderA');
    });
  });
});