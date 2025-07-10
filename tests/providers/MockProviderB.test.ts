import { MockProviderB } from '../../src/providers/MockProviderB';

describe('MockProviderB', () => {
  let provider: MockProviderB;

  beforeEach(() => {
    provider = new MockProviderB(0.1); // 10% failure rate
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Control random for consistent tests
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  describe('sendEmail', () => {
    it('should successfully send email when not failing', async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Above fail rate
      const consoleSpy = jest.spyOn(console, 'log');
      
      const result = await provider.sendEmail('test@example.com', 'Test', 'Body');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockProviderB] Email sent to test@example.com')
      );
    });

    it('should fail to send email based on fail rate', async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.05); // Below fail rate
      
      await expect(provider.sendEmail('test@example.com', 'Test', 'Body'))
        .rejects.toThrow('MockProviderB failed to send email to test@example.com');
    });

    it('should have longer delay than ProviderA', async () => {
      jest.useFakeTimers();
      const sendPromise = provider.sendEmail('test@example.com', 'Test', 'Body');
      
      jest.advanceTimersByTime(150);
      await Promise.resolve(); // Allow any pending promises to resolve
      expect(sendPromise).not.toBeNull(); // Still pending
      
      jest.advanceTimersByTime(300);
      await expect(sendPromise).resolves.toBeDefined();
      jest.useRealTimers();
    });
  });

  describe('getProviderName', () => {
    it('should return correct provider name', () => {
      expect(provider.getProviderName()).toBe('MockProviderB');
    });
  });
});