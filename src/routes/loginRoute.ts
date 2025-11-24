import { Router } from "express";
import { loginUser } from "../controllers/userController/login";

const router = Router();

router.post('/login', loginUser);

export default router;