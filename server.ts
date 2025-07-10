import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { EmailService } from './src/EmailService';
import { MockProviderA } from './src/providers/MockProviderA';
import { MockProviderB } from './src/providers/MockProviderB';
import path from 'path';

// Initialize email service
const providerA = new MockProviderA(0.3);
const providerB = new MockProviderB(0.1);
const emailService = new EmailService(providerA, providerB, 10, 60000, 3, 1000);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint
app.post('/api/send-emails', async (req: Request, res: Response) => {
  try {
    const emails = req.body;
    const results = [];
    
    for (const email of emails) {
      const result = await emailService.sendEmail({
        ...email,
        idempotencyKey: `${email.to}-${Date.now()}`
      });
      results.push(result);
    }
    
    res.json(results);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Serve frontend
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});