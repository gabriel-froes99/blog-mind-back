import { Router } from "express";
import { loginUser } from '../controllers/userController/login';
import { registerUser } from '../controllers/userController/register';
import { createArticle } from '../controllers/articleController/createArticle';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/articles', createArticle);

export default router;