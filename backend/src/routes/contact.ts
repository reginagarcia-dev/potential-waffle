import { Router, Request, Response, NextFunction } from 'express';
import { contactSchema } from 'shared';
import { sanitizeText } from '../utils/sanitize.js';
import { sendFeedbackNotification } from '../services/email.js';

export const contactRouter = Router();

contactRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = contactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, message } = parseResult.data;
    const sanitizedMessage = sanitizeText(message);

    if (!sanitizedMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    await sendFeedbackNotification(email, sanitizedMessage);

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});
