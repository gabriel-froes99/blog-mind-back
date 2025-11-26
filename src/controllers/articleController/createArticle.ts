import { RequestHandler } from 'express';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../../http/database';
import { createArticleService } from '../../service/articles/article.service';

export const createArticle = async (req: any, res:any) => {
    
    const { title, description, imageBlob, imageMimeType, author, content, userId } = req.body;
    
    try{

        const article = await createArticleService({title, description, imageBlob, imageMimeType, author, content, userId});


         if (!title || !description || !author || !content || !userId) {
             res.status(400).json({ message: 'Título, descrição, autor, conteúdo e ID do usuário são obrigatórios.' });
        }
         
          res.status(201).json({
            message: 'Artigo criado com sucesso!',
            data: { title, description, author, imageMimeType, content, user_id: userId }
        });

       


    }catch(error:any){
        console.error('Erro ao criar artigo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar artigo.', error: error.message });
    }

}