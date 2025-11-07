import { initDatabase } from '../config/database.js';

console.log('初始化数据库...');
initDatabase();
console.log('数据库初始化完成！');
process.exit(0);

