import mysql from 'mysql2/promise';
import dotenv from 'dotenv';


dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'blogdb',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);



console.log('Tentando conectar ao MySQL com as configurações:', { host: dbConfig.host, user: dbConfig.user, database: dbConfig.database, port: dbConfig.port });
pool.getConnection()
  .then(connection => {
    console.log('Conectado ao MySQL com sucesso!');
    connection.release(); 
  })
  .catch(err => console.error('Falha ao conectar ao MySQL:', err.message));

  pool.execute('CREATE DATABASE IF NOT EXISTS blogdb')
  .then(() => console.log(`Banco de dados '${dbConfig.database}' verificado/criado com sucesso.`))
  .catch(err => console.error('Erro ao criar/verificar o banco de dados:', err.message));

export default pool;