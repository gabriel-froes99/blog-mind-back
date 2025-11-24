import app from "../http/app";
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../http/database';


export const register =  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password, confirmPassword } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error: any) {
        console.error('Erro ao cadastrar usuário:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email já está em uso.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};