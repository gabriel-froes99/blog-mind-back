import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import bcrypt from 'bcrypt';
import pool from './database';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json()); // Para parsear o corpo da requisição como JSON

// app.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   try {
//     const { email, password } = req.body;
//     console.log('Dados recebidos em /login:', { email }); // Evite logar senhas em produção
//     // TODO: Adicionar lógica de autenticação com o banco de dados aqui
//     // Exemplo: const user = await authService.login(email, password);

//     // Simulação de sucesso por enquanto
//   } catch (error) {
//     // Passa qualquer erro ocorrido para o middleware de tratamento de erros global
//     next(error);
//   }
// });
 app.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
 try {
     const { email, password } = req.body;
    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere no banco
    const [result] = await pool.execute(
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
});

export default app ;