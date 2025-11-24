import { Router } from "express";
import { registerUser } from '../controllers/userController/register';

const router = Router();

router.post('/register', registerUser);

export default router;