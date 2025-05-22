import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import bcrypt from 'bcrypt';
import pool from './database';

interface User {
  id: number;
  email: string;
  password_hash: string;
}

// Interface atualizada para um novo artigo
interface Article {
    title: string;
    description: string; // Nova coluna
    imageBlob?: string; // Dados da imagem em base64 (string)
    imageMimeType?: string; // Tipo MIME da imagem (ex: 'image/jpeg')
    author: string; // Nova coluna
    content: string; // O que antes era 'content', agora pode ser a 'description' ou um campo separado para o corpo do artigo
}


const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' })); // Aumente o limite para lidar com imagens base64 grandes
// Se for receber formulários multipart (com upload de arquivo nativo), precisaria de 'multer' aqui
// app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Para dados de formulário URL-encoded


app.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email, password } = req.body;
    console.log('Dados recebidos em /login:', { email });

    const [rows] = await pool.execute('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    const user = users[0] as User;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    res.status(200).json({ message: 'Login bem-sucedido!', userId: user.id, email: user.email });

  } catch (error: any) {
    next(error);
  }
});

app.post('/cadastro', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

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

// NOVO ENDPOINT ATUALIZADO: Criar Artigo com BLOB
app.post('/articles', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // Renomeei 'content' para 'articleContent' no frontend para evitar confusão com 'description'
        const { title, description, imageBlob, imageMimeType, author, articleContent } = req.body;

        // // Validação básica
        // if (!title || !description || !author || !articleContent) {
        //     return res.status(400).json({ message: 'Título, descrição, autor e conteúdo são obrigatórios.' });
        // }

        let imageData = null; // Buffer para o BLOB
        if (imageBlob && imageMimeType) {
            // Remove o prefixo de dados (ex: "data:image/jpeg;base64,")
            const base64Data = imageBlob.split(',')[1];
            if (base64Data) {
                imageData = Buffer.from(base64Data, 'base64');
            }
        }

        // Insere o novo artigo no banco de dados
        const [result] = await pool.execute(
            'INSERT INTO articles (title, description, image_blob, image_mime_type, date, author) VALUES (?, ?, ?, ?, NOW(), ?)',
            [title, description, imageData, imageMimeType, author]
            // Nota: 'date' será preenchido automaticamente por NOW() ou CURRENT_TIMESTAMP no MySQL
        );

        const insertId = (result as any).insertId;

        res.status(201).json({
            message: 'Artigo criado com sucesso!',
            articleId: insertId,
            data: { title, description, author, imageMimeType, content: articleContent }
        });

    } catch (error: any) {
        console.error('Erro ao criar artigo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar artigo.', error: error.message });
    }
});


// Middleware de tratamento de erros (opcional, mas boa prática)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado no servidor!');
});

export default app;