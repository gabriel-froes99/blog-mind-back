import { Router } from "express";
import { loginUser } from '../controllers/userController/login';
import { registerUser } from '../controllers/userController/register';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);

export default router;