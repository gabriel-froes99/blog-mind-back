import app from "../http/app";
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../http/database';

// auth/register.service.ts
export const register = async (email: string, password: string) => { // Tipagem corrigida
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.execute<ResultSetHeader>(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        // Apenas retorna uma mensagem de sucesso, não lança erro
        return { message: 'Usuário cadastrado com sucesso!' }; 

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            // Lança um erro com uma propriedade 'status' para ser capturado no controller
            const duplicateError: any = new Error('Email já está em uso.');
            duplicateError.status = 409;
            throw duplicateError;
        }
        // Lança erro 500 para qualquer outro erro
        const serverError: any = new Error('Erro interno do servidor.');
        serverError.status = 500;
        throw serverError;
    }
};