// Assumindo que app.ts exporta: export default app;
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
    // Este catch é para erros síncronos raros durante a configuração inicial
    console.error('Erro inesperado durante a configuração do servidor:', error);
    process.exit(1); // Encerra se houver erro na configuração
  }
};

// Inicia o servidor
startServer();
