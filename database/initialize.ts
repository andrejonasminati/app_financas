import { type SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT,
        data_fim TEXT,
        visible INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        gasto_id INTEGER,
        origem_id INTEGER,
        pagamento_id INTEGER,
        data_fim TEXT,
        visible INTEGER DEFAULT 1,
        FOREIGN KEY (gasto_id) REFERENCES categories (id),
        FOREIGN KEY (origem_id) REFERENCES categories (id),
        FOREIGN KEY (pagamento_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      /* Índices para alta performance de consultas por data, visibilidade e chaves estrangeiras */
      CREATE INDEX IF NOT EXISTS idx_expenses_date_visible ON expenses(date, visible);
      CREATE INDEX IF NOT EXISTS idx_expenses_gasto ON expenses(gasto_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_origem ON expenses(origem_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_pagamento ON expenses(pagamento_id);
      CREATE INDEX IF NOT EXISTS idx_categories_type_visible ON categories(type, visible);

      PRAGMA optimize;
    `);

    // Adicionar colunas se elas não existirem (para o caso de tabelas já criadas)
    const columnsToAdd = [
      { table: 'expenses', column: 'data_fim', type: 'TEXT' },
      { table: 'expenses', column: 'visible', type: 'INTEGER DEFAULT 1' },
      { table: 'categories', column: 'data_fim', type: 'TEXT' },
      { table: 'categories', column: 'visible', type: 'INTEGER DEFAULT 1' },
    ];

    for (const item of columnsToAdd) {
      try {
        await db.execAsync(`ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.type};`);
      } catch (e) {
        // Coluna provavelmente já existe
      }
    }

    // Garantir que o usuário Admin padrão exista
    const admin: any = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', ['Admin']);
    if (!admin) {
      await db.runAsync("INSERT INTO users (username, password) VALUES ('Admin', '123')");
    }

    // Limpar gastos se necessário
    const resetDone: any = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', ['database_reset_v3']);
    if (!resetDone) {
      await db.runAsync("DELETE FROM expenses");
      // Opcional: Limpar categorias também se quiser um fresh start total
      // await db.runAsync("DELETE FROM categories"); 
      
      await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ['database_reset_v3', 'true']);
    }
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
    throw error;
  }
}
