import { RequestHandler } from 'express';
import { ResultSetHeader } from 'mysql2/promise';
import pool from '../../http/database';
import { RowDataPacket } from 'mysql2/promise';
import { get } from 'http';

interface article extends RowDaraPacket{
    title:string,
     description:string,
    imageBlob:string,
    imageMimeType:string,
    author:string,
    content:string,
    userId:number
}



export const createArticleService = async (data: article) => {
    
    try {
        
        const { title, description, imageBlob, imageMimeType, author, content, userId } = data;
        
        let imageData = null; 
        if (imageBlob && imageMimeType) {
            
            const base64Data = imageBlob.split(',')[1];
            if (base64Data) {
                imageData = Buffer.from(base64Data, 'base64');
            }
        }
        
        
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO articles (title, description, image_blob, image_mime_type, date, author, user_id, content) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)',
            [title, description, imageBlob, imageMimeType, author, userId, content]
        );
        
        
        const insertId = result.insertId;
        
        return {
            articleId: insertId
        }
        
        
    } catch (error: any) {
        
    }
};


export const getUserArticle = async () =>{
    try{
        
    }catch(error:any){

    }
}

