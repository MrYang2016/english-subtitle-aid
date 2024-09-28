import mysql from 'mysql2';
const env = process.env.CUSTOM_ENV || process.env.NODE_ENV || "local";

console.log('env', env);

let pool: mysql.Pool;
export async function getConnection() {
  if (!pool) {
    const dbOptions: mysql.PoolOptions = {
      host: 'localhost', // 数据库主机
      user: 'root', // 数据库用户名
      database: 'en_learn', // 数据库名称
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }
    if (env === 'production') {
      dbOptions.password = process.env.MYSQL_PASSWORD;
    }
    pool = mysql.createPool(dbOptions);
  }
  return pool.promise();
}