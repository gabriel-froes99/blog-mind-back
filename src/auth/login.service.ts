import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2/promise';
import { app } from '../http/app';
import pool from '../../src/http/database';
import jwt from 'jsonwebtoken';


interface User extends RowDataPacket {
    id: number;
    email: string;
    password_hash: string;
}


export const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {   
        const { email, password } = req.body;
        console.log('Dados recebidos em /login:', { email });

        
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);

        const users = rows as User[]; 
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const user = users[0]; 
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const secret = process.env.JWT_SECRET || "fallback-secret-key";

        
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
        }
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          secret,
          { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login bem-sucedido!', userId: user.id, email: user.email });
        
        return{
            user: {
                id: user.id,
                email: user.email
            },
            token: token
        }
        

    } catch (error: any) {
        console.error('Erro no login:', error);
        next(error); 
    }
}