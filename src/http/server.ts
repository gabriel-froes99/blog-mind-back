
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = () => {
  try {
    const serverInstance = app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });

  } catch (error) {
    
    console.error('Erro inesperado durante a configuração do servidor:', error);
    process.exit(1); 
  }
};


startServer();
