import pool from "../../http/database";



interface UserProfile {
  id: number;
  email: string;
  name: string;
  profilePicture?: string;
  createdAt?: string;
}

export const editProfile = async (userId: number, profileData: Partial<UserProfile>) => {
    try{

        await pool.execute(
            `UPDATE users SET name = ?, profile_picture = ? WHERE id = ?`,
            [profileData.name, profileData.profilePicture, userId],
        );
        return { message: 'Perfil atualizado com sucesso.' };
    }catch(error:any){
        throw new Error('Erro ao atualizar o perfil: ' + error.message);
    }
}