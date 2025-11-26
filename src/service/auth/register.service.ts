import bcrypt from 'bcrypt';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../../http/database';


export const register = async (email: string, password: string) => { 
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.execute<ResultSetHeader>(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        
        return { message: 'Usuário cadastrado com sucesso!' }; 

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
       
            const duplicateError: any = new Error('Email já está em uso.');
            duplicateError.status = 409;
            throw duplicateError;
        }
        
        const serverError: any = new Error('Erro interno do servidor.');
        serverError.status = 500;
        throw serverError;
    }
};