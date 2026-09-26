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
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'trading_store.json');

export function getStore(): StoreData {
  if (memoryStore) {
    return memoryStore;
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      memoryStore = JSON.parse(content);
      return memoryStore!;
    }
  } catch (err) {
    console.error('Failed to read trading store, falling back to default:', err);
  }

  memoryStore = JSON.parse(JSON.stringify(DEFAULT_STORE));
  saveStore(memoryStore!);
  return memoryStore!;
}

export function saveStore(store: StoreData): void {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal if read-only filesystem, memory store continues working
    console.error('Error saving store to disk:', err);
  }
}

export function setMemoryStoreOnly(store: StoreData): void {
  memoryStore = store;
}
