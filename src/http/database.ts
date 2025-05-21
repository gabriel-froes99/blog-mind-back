import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Garante que dotenv.config() seja chamado para carregar as variáveis de ambiente
// Se já estiver sendo chamado no server.ts, esta chamada aqui pode ser redundante,
// mas não prejudica e garante que as variáveis estejam disponíveis.
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'blogdb',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Ajuste conforme necessário
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

console.log('Tentando conectar ao MySQL com as configurações:', { host: dbConfig.host, user: dbConfig.user, database: dbConfig.database, port: dbConfig.port });
pool.getConnection()
  .then(connection => {
    console.log('Conectado ao MySQL com sucesso!');
    connection.release(); // Libera a conexão de volta para o pool
  })
  .catch(err => console.error('Falha ao conectar ao MySQL:', err.message));

export default pool;