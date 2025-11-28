import { editProfile } from "../../service/edit/edit.profile";
import { RequestHandler, Request, Response } from "express";
import pool from "../../http/database";


interface EditProfileBody {   
    name?: string;
    profilePicture?: string;
}

interface AuthenticatedRequest extends Request {
    userId?: number;
    body: EditProfileBody;
}

export const editUserProfile: RequestHandler<{}, any, EditProfileBody> = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            res.status(401).json({ 
                message: 'Usuário não autenticado',
                success: false 
            });
            return;
        }

        const { name, profilePicture } = req.body;

        // Validação básica
        if (!name && !profilePicture) {
            res.status(400).json({ 
                message: 'Pelo menos um campo deve ser preenchido (name ou profilePicture)',
                success: false 
            });
            return;
        }

        if (name && typeof name !== 'string') {
            res.status(400).json({ 
                message: 'Nome deve ser uma string',
                success: false 
            });
            return;
        }

        if (name && name.trim().length === 0) {
            res.status(400).json({ 
                message: 'Nome não pode estar vazio',
                success: false 
            });
            return;
        }

        const result = await editProfile(userId, { name, profilePicture });

        res.status(200).json({
            message: 'Perfil atualizado com sucesso',
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ 
            message: 'Erro ao atualizar o perfil',
            success: false,
            error: error.message 
        });
    }
}