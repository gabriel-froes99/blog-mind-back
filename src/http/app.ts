import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import bcrypt from 'bcrypt';
import pool from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2'; 



interface User extends RowDataPacket {
    id: number;
    email: string;
    password_hash: string;
}


interface ArticleDB extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    image_blob?: Buffer; 
    image_mime_type?: string;
    date: Date; 
    author: string;
    user_id: number; 
    content?: string; 
}

const app = express();


app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json({ limit: '50mb' }));

// =======================================================================================
// ROTAS DE AUTENTICAÇÃO
// =======================================================================================

app.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password } = req.body;
        console.log('Dados recebidos em /login:', { email });

        // Busca o usuário pelo email
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);

        const users = rows as User[]; // Faz cast para sua interface User[]
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const user = users[0]; 
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        // Retorna o userId e email após login bem-sucedido
        res.status(200).json({ message: 'Login bem-sucedido!', userId: user.id, email: user.email });

    } catch (error: any) {
        console.error('Erro no login:', error);
        next(error); // Passa o erro para o middleware de tratamento de erros
    }
});

app.post('/cadastro', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insere o novo usuário no banco de dados
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error: any) {
        console.error('Erro ao cadastrar usuário:', error);
        // Verifica se o erro é de entrada duplicada (email já em uso)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email já está em uso.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// =======================================================================================
// ROTAS DE ARTIGOS
// =======================================================================================

// Rota para CRIAR NOVO ARTIGO com user_id
app.post('/articles', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // userId deve ser enviado no body junto com os dados do artigo
        const { title, description, imageBlob, imageMimeType, author, content, userId } = req.body;

        // Validação de campos obrigatórios
        if (!title || !description || !author || !content || !userId) {
            return res.status(400).json({ message: 'Título, descrição, autor, conteúdo e ID do usuário são obrigatórios.' });
        }

        let imageData = null; // Buffer para o BLOB
        if (imageBlob && imageMimeType) {
            // Remove o prefixo de dados (ex: "data:image/jpeg;base64,") para obter apenas os dados base64
            const base64Data = imageBlob.split(',')[1];
            if (base64Data) {
                imageData = Buffer.from(base64Data, 'base64');
            }
        }

        // Insere o novo artigo no banco de dados, incluindo user_id e content
        // As colunas precisam corresponder ao seu esquema real do MySQL.
        // Assumindo: id, title, description, image_blob, image_mime_type, date, author, user_id, content
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO articles (title, description, image_blob, image_mime_type, date, author, user_id, content) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)',
            [title, description, imageData, imageMimeType, author, userId, content]
        );

        const insertId = result.insertId; // ID do artigo recém-criado

        res.status(201).json({
            message: 'Artigo criado com sucesso!',
            articleId: insertId,
            data: { title, description, author, imageMimeType, content, user_id: userId }
        });

    } catch (error: any) {
        console.error('Erro ao criar artigo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar artigo.', error: error.message });
    }
});


app.get('/articles/user/:userId', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
         res.status(400).json({ message: 'ID do usuário inválido.' });
         return;
    }

    try {
        
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles WHERE user_id = ? ORDER BY date DESC', [userId]);

        // Mapeia os resultados do banco de dados para a interface ArticleDB,
        // convertendo o BLOB da imagem para base64 para envio ao frontend.
        const articles = rows.map(row => {
            const article = row as ArticleDB; // Faz cast para ArticleDB
            return {
                ...article,
                image_blob: article.image_blob ? Buffer.from(article.image_blob).toString('base64') : undefined,
                date: new Date(article.date) // Converte a data para objeto Date
            };
        });

        res.status(200).json(articles);
    } catch (err: any) {
        console.error('Erro ao buscar artigos do usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar artigos do usuário.', error: err.message });
    }
});


// 2. Rota para OBTER UM ÚNICO ARTIGO POR ID (MAIS GENÉRICA, DEPOIS DA ESPECÍFICA)
app.get('/articles/:id', async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);

    if (isNaN(articleId)) {
         res.status(400).json({ message: 'ID do artigo inválido.' });
         return;
    }

    try {
        // Busca um único artigo pelo seu ID
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles WHERE id = ?', [articleId]);

        if (rows.length === 0) {
             res.status(404).json({ message: 'Artigo não encontrado.' });
             return;
        }

        const article = rows[0] as ArticleDB; // Faz cast para ArticleDB
        // Converte o BLOB da imagem para base64 antes de enviar
        const articleWithBase64 = {
            ...article,
            image_blob: article.image_blob ? Buffer.from(article.image_blob).toString('base64') : undefined,
            date: new Date(article.date) // Converte a data para objeto Date
        };

        res.status(200).json(articleWithBase64);
    } catch (err: any) {
        console.error('Erro ao buscar artigo:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar artigo.', error: err.message });
    }
});


// 3. Rota para OBTER TODOS OS ARTIGOS
app.get('/articles', async (req: Request, res: Response) => {
    try {
        // Busca todos os artigos
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM articles ORDER BY date DESC');

        // Mapeia os resultados convertendo o BLOB da imagem para base64
        const articlesWithBase64 = rows.map(row => {
            const article = row as ArticleDB; // Faz cast para ArticleDB
            return {
                ...article,
                image_blob: article.image_blob ? Buffer.from(article.image_blob).toString('base64') : undefined,
                date: new Date(article.date) // Converte a data para objeto Date
            };
        });

        res.status(200).json(articlesWithBase64);
    } catch (err: any) {
        console.error('Erro ao buscar artigos:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar artigos.', error: err.message });
    }
});

// Rota para EXCLUIR ARTIGO
app.delete('/articles/:id', async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);
    const userId = req.headers['x-user-id']; // Espera o user ID no cabeçalho X-User-Id

    if (isNaN(articleId)) {
         res.status(400).json({ message: 'ID do artigo inválido.' });
         return;
    }
    if (!userId) { // Validação se o user ID foi fornecido
         res.status(401).json({ message: 'Autorização necessária para exclusão.' });
         return;
    }

    try {
        // Primeiro, verifica se o artigo existe e se pertence ao usuário
        const [checkRows] = await pool.execute<RowDataPacket[]>('SELECT user_id FROM articles WHERE id = ?', [articleId]);
        if (checkRows.length === 0) {
             res.status(404).json({ message: 'Artigo não encontrado.' });
             return;
        }
        const article = checkRows[0] as ArticleDB; // Faz cast para ArticleDB
        // Compara o user_id do artigo com o userId fornecido no cabeçalho
        if (article.user_id !== parseInt(userId as string)) {
             res.status(403).json({ message: 'Você não tem permissão para excluir este artigo.' });
             return;
        }

        // Se a verificação passar, procede com a exclusão
        const [result] = await pool.execute<ResultSetHeader>('DELETE FROM articles WHERE id = ?', [articleId]);

        // Verifica se alguma linha foi realmente afetada (artigo excluído)
        if (result.affectedRows === 0) {
             res.status(404).json({ message: 'Artigo não encontrado para exclusão.' });
             return;
        }
        res.status(200).json({ message: 'Artigo excluído com sucesso!' });
    } catch (err: any) {
        console.error('Erro ao excluir artigo:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir artigo.', error: err.message });
    }
});

// Rota para ATUALIZAR ARTIGO
app.put('/articles/:id', async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);
    // userId é esperado no body para verificação de permissão
    const { title, description, author, content, imageBlob, imageMimeType, userId } = req.body;

    if (isNaN(articleId)) {
         res.status(400).json({ message: 'ID do artigo inválido.' });
         return;
    }
    if (!userId) { // Validação se o user ID foi fornecido
         res.status(401).json({ message: 'Autorização necessária para atualização.' });
         return;
    }
    if (!title || !description || !author || !content) {
         res.status(400).json({ message: 'Título, descrição, autor e conteúdo são obrigatórios para atualização.' });
         return;
    }

    try {
        // Primeiro, verifica se o artigo existe e se pertence ao usuário
        const [checkRows] = await pool.execute<RowDataPacket[]>('SELECT user_id FROM articles WHERE id = ?', [articleId]);
        if (checkRows.length === 0) {
             res.status(404).json({ message: 'Artigo não encontrado.' });
             return;
        }
        const article = checkRows[0] as ArticleDB; // Faz cast para ArticleDB
        // Compara o user_id do artigo com o userId fornecido no body
        if (article.user_id !== parseInt(userId as string)) {
             res.status(403).json({ message: 'Você não tem permissão para atualizar este artigo.' });
             return;
        }

        let imageData = null; // Buffer para o BLOB da imagem
        if (imageBlob && imageMimeType) {
            const base64Data = imageBlob.split(',')[1];
            if (base64Data) {
                imageData = Buffer.from(base64Data, 'base64');
            }
        }

        // Procede com a atualização do artigo
        const [result] = await pool.execute<ResultSetHeader>(
            'UPDATE articles SET title = ?, description = ?, author = ?, content = ?, image_blob = ?, image_mime_type = ?, date = NOW() WHERE id = ?',
            [title, description, author, content, imageData, imageMimeType, articleId]
        );

        // Verifica se alguma linha foi realmente afetada (artigo atualizado)
        if (result.affectedRows === 0) {
             res.status(404).json({ message: 'Artigo não encontrado para atualização.' });
             return;
        }
        res.status(200).json({ message: 'Artigo atualizado com sucesso!' });
    } catch (err: any) {
        console.error('Erro ao atualizar artigo:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar artigo.', error: err.message });
    }
});


// =======================================================================================
// TRATAMENTO DE ERROS E INÍCIO DO SERVIDOR
// =======================================================================================

// Middleware de tratamento de erros genérico
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Loga o stack trace do erro no console do servidor
    res.status(500).send('Algo deu errado no servidor! Erro: ' + err.message); // Envia uma resposta de erro para o cliente
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;