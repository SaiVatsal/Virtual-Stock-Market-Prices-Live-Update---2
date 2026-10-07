import fs from 'fs';
import path from 'path';
import { AccountState, Position, SignalItem, AppSettings } from './types';

export interface StoreData {
  account: AccountState;
  positions: Position[];
  history: Position[];
  signals: SignalItem[];
  settings: AppSettings;
}

const DEFAULT_STORE: StoreData = {
  account: {
    balance: 100000,
    equity: 100000,
    marginUsed: 0,
    freeMargin: 100000,
    marginLevel: 0,
    unrealizedPnL: 0,
    realizedPnL: 0,
    leverage: 100,
    currency: 'USD'
  },
  positions: [],
  history: [],
  signals: [],
  settings: {
    initialBalance: 100000,
    leverage: 100
  }
};

let memoryStore: StoreData | null = null;
let lastDiskMtimeMs = 0;
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'trading_store.json');

const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST));

export function getStore(): StoreData {
  if (isTestEnv && memoryStore) {
    return memoryStore;
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const stats = fs.statSync(STORE_FILE);
      if (!memoryStore || stats.mtimeMs > lastDiskMtimeMs) {
        const content = fs.readFileSync(STORE_FILE, 'utf-8');
        memoryStore = JSON.parse(content);
        lastDiskMtimeMs = stats.mtimeMs;
      }
      return memoryStore!;
    }
  } catch (err) {
    console.error('Failed to read trading store, falling back to memory/default:', err);
  }

  if (!memoryStore) {
    memoryStore = JSON.parse(JSON.stringify(DEFAULT_STORE));
    if (!isTestEnv) {
      saveStore(memoryStore!);
    }
  }
  return memoryStore!;
}

export function saveStore(store: StoreData): void {
  memoryStore = store;

  if (isTestEnv) {
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    try {
      const stats = fs.statSync(STORE_FILE);
      lastDiskMtimeMs = stats.mtimeMs;
    } catch {}
  } catch (err) {
    // Non-fatal if read-only filesystem, memory store continues working
    console.error('Error saving store to disk:', err);
  }
}

export function setMemoryStoreOnly(store: StoreData): void {
  memoryStore = store;
}
