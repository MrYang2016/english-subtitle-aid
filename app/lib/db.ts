import mysql from 'mysql2/promise';
const env = process.env.CUSTOM_ENV || process.env.NODE_ENV || "local";

console.log('env', env);

let connection: mysql.Connection;
export async function getConnection() {
  if (!connection) {
    const dbOptions: mysql.ConnectionOptions = {
      host: 'localhost', // 数据库主机
      user: 'root', // 数据库用户名
      database: 'en_learn' // 数据库名称
    }
    if (env === 'production') {
      dbOptions.password = process.env.MYSQL_PASSWORD;
    }
    connection = await mysql.createConnection(dbOptions);
  }
  return connection;
}
