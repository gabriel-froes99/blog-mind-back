import { RequestHandler } from 'express';
import { register } from '../../auth/register.service';

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const result = await register(req, res, next);
    return result;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
