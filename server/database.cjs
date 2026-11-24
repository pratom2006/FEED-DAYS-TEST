'use strict';
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
function openDatabase(filename){
  if(filename!==':memory:')fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true,mode:0o700});
  const db=new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys=ON;
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS accounts(
      id TEXT PRIMARY KEY COLLATE NOCASE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions(
      token_hash TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);
  `);
  return db;
}
module.exports={openDatabase};
