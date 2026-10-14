import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databasePath =
  process.env.EMPLOYEE_DB_PATH ?? path.join(process.cwd(), "data", "employees.db");

declare global {
  var employeeDatabase: Database.Database | undefined;
}

function createDatabase() {
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      position TEXT NOT NULL CHECK (length(position) BETWEEN 1 AND 100),
      department TEXT NOT NULL CHECK (length(department) BETWEEN 1 AND 100),
      status TEXT NOT NULL CHECK (status IN ('active', 'on-leave', 'inactive')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  return database;
}

export const db = global.employeeDatabase ?? createDatabase();

if (process.env.NODE_ENV !== "production") global.employeeDatabase = db;