// controllers/auth.controller.ts
import { RequestHandler } from 'express';
import { register } from '../../auth/register.service';


interface RegisterBody {
    email: string;
    password: string;
}


export const registerUser: RequestHandler<{}, any, RegisterBody, {}> = async (req, res, next) => {
    console.log('🎯 REGISTER CONTROLLER - Chegou requisição');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    
    try {
        const result = await register(req.body.email, req.body.password);
        console.log('✅ Registro bem-sucedido');
        res.status(201).json(result);
    } catch (error: any) {
        console.log('❌ Erro no controller:', error.message);
        const statusCode = error.status || 400;
        res.status(statusCode).json({ error: error.message });
    }
};