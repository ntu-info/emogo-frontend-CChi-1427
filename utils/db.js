// utils/db.js
import * as SQLite from 'expo-sqlite';

let db;

export async function openDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('esm_data.db');
    // 初始化資料表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        sentiment INTEGER,
        video_uri TEXT,
        latitude REAL,
        longitude REAL
      );
    `);
  }
  return db;
}

export async function insertLog(sentiment, videoUri, location) {
  const database = await openDatabase();
  const timestamp = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO logs (timestamp, sentiment, video_uri, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
    timestamp,
    sentiment,
    videoUri,
    location?.coords?.latitude || null,
    location?.coords?.longitude || null
  );
  console.log("Data saved!");
}