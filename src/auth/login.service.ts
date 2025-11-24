import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2/promise';
import pool from '../http/database';
import jwt from 'jsonwebtoken';

interface User extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
}

export const login = async (email: string, password: string) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email]
  );

  const users = rows as User[];

  if (users.length === 0) {
    throw new Error('Email ou senha inválidos.');
  }

  const user = users[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error('Email ou senha inválidos.');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email
    },
    token
  };
};
