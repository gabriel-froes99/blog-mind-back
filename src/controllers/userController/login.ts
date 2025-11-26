import { RequestHandler } from 'express';
import { login } from '../../service/auth/login.service';

export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await login(email, password);

    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};
