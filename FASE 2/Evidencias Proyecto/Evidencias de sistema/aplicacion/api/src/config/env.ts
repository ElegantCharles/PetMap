import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'meinpets_db',
    user: process.env.POSTGRES_USER || 'meinpets_user',
    password: process.env.POSTGRES_PASSWORD || 'meinpets_password',
  },
};
