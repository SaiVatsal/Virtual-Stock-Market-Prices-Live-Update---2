import fs from 'fs';
import path from 'path';
import { AccountState, Position, SignalItem, AppSettings, UserProfile } from './types';

export interface UserRecord {
  id: string;
  username: string;
  password: string; // Plaintext or hash for virtual terminal
  role: 'ADMIN' | 'TRADER' | 'admin' | 'trader';
  accountNumber: string;
  createdAt: number;
  account: AccountState;
  positions: Position[];
  history: Position[];
  settings: AppSettings;
}

export interface StoreData {
  account: AccountState;
  positions: Position[];
  history: Position[];
  signals: SignalItem[];
  settings: AppSettings;
  users?: Record<string, UserRecord>;
  activeUserId?: string;
}

const DEFAULT_ACCOUNT: AccountState = {
  balance: 100000,
  equity: 100000,
  marginUsed: 0,
  freeMargin: 100000,
  marginLevel: 0,
  unrealizedPnL: 0,
  realizedPnL: 0,
  leverage: 100,
  currency: 'USD'
};

const DEFAULT_SETTINGS: AppSettings = {
  initialBalance: 100000,
  leverage: 100
};

const DEFAULT_ADMIN_USER: UserRecord = {
  id: 'vatsal1327@gmail.com',
  username: 'vatsal1327@gmail.com',
  password: 'Bitcoin@100',
  role: 'ADMIN',
  accountNumber: 'EX-9482104',
  createdAt: 1710000000000,
  account: { ...DEFAULT_ACCOUNT },
  positions: [],
  history: [],
  settings: { ...DEFAULT_SETTINGS }
};

const DEFAULT_DEMO_USER: UserRecord = {
  id: 'sai1327y@gmail.com',
  username: 'sai1327y@gmail.com',
  password: 'Sai@987654321',
  role: 'TRADER',
  accountNumber: 'EX-5582910',
  createdAt: 1710000000000,
  account: {
    balance: 50000,
    equity: 50000,
    marginUsed: 0,
    freeMargin: 50000,
    marginLevel: 0,
    unrealizedPnL: 0,
    realizedPnL: 0,
    leverage: 200,
    currency: 'USD'
  },
  positions: [],
  history: [],
  settings: {
    initialBalance: 50000,
    leverage: 200
  }
};

const DEFAULT_STORE: StoreData = {
  account: { ...DEFAULT_ACCOUNT },
  positions: [],
  history: [],
  signals: [],
  settings: { ...DEFAULT_SETTINGS },
  users: {
    'vatsal1327@gmail.com': { ...DEFAULT_ADMIN_USER },
    admin: {
      ...DEFAULT_ADMIN_USER,
      id: 'admin',
      username: 'admin',
      password: 'Bitcoin@100'
    },
    'sai1327y@gmail.com': { ...DEFAULT_DEMO_USER },
    demo: {
      ...DEFAULT_DEMO_USER,
      id: 'demo',
      username: 'demo',
      password: 'Sai@987654321'
    }
  },
  activeUserId: 'vatsal1327@gmail.com'
};

let memoryStore: StoreData | null = null;
let lastDiskMtimeMs = 0;
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'trading_store.json');

const isTestEnv = typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST));

function ensureUserStructure(store: StoreData): void {
  if (!store.users) {
    store.users = {};
  }

  // Master Admin Account (Requested by User)
  if (!store.users['vatsal1327@gmail.com']) {
    store.users['vatsal1327@gmail.com'] = {
      id: 'vatsal1327@gmail.com',
      username: 'vatsal1327@gmail.com',
      password: 'Bitcoin@100',
      role: 'ADMIN',
      accountNumber: 'EX-9482104',
      createdAt: 1710000000000,
      account: store.account || { ...DEFAULT_ACCOUNT },
      positions: store.positions || [],
      history: store.history || [],
      settings: store.settings || { ...DEFAULT_SETTINGS }
    };
  } else {
    store.users['vatsal1327@gmail.com'].password = 'Bitcoin@100';
    store.users['vatsal1327@gmail.com'].role = 'ADMIN';
  }

  // Admin alias for backward compatibility
  if (!store.users.admin) {
    store.users.admin = {
      id: 'admin',
      username: 'admin',
      password: 'Bitcoin@100',
      role: 'ADMIN',
      accountNumber: 'EX-9482104',
      createdAt: 1710000000000,
      account: store.account || { ...DEFAULT_ACCOUNT },
      positions: store.positions || [],
      history: store.history || [],
      settings: store.settings || { ...DEFAULT_SETTINGS }
    };
  } else {
    store.users.admin.role = 'ADMIN';
    store.users.admin.password = 'Bitcoin@100';
    if (!store.users.admin.account) store.users.admin.account = store.account || { ...DEFAULT_ACCOUNT };
    if (!store.users.admin.positions) store.users.admin.positions = store.positions || [];
    if (!store.users.admin.history) store.users.admin.history = store.history || [];
    if (!store.users.admin.settings) store.users.admin.settings = store.settings || { ...DEFAULT_SETTINGS };
  }

  // User Trader Account (Requested by User)
  if (!store.users['sai1327y@gmail.com']) {
    store.users['sai1327y@gmail.com'] = {
      id: 'sai1327y@gmail.com',
      username: 'sai1327y@gmail.com',
      password: 'Sai@987654321',
      role: 'TRADER',
      accountNumber: 'EX-5582910',
      createdAt: 1710000000000,
      account: {
        balance: 50000,
        equity: 50000,
        marginUsed: 0,
        freeMargin: 50000,
        marginLevel: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        leverage: 200,
        currency: 'USD'
      },
      positions: [],
      history: [],
      settings: {
        initialBalance: 50000,
        leverage: 200
      }
    };
  } else {
    store.users['sai1327y@gmail.com'].password = 'Sai@987654321';
    store.users['sai1327y@gmail.com'].role = 'TRADER';
  }

  // Demo alias for backward compatibility
  if (!store.users.demo) {
    store.users.demo = {
      id: 'demo',
      username: 'demo',
      password: 'Sai@987654321',
      role: 'TRADER',
      accountNumber: 'EX-5582910',
      createdAt: 1710000000000,
      account: {
        balance: 50000,
        equity: 50000,
        marginUsed: 0,
        freeMargin: 50000,
        marginLevel: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        leverage: 200,
        currency: 'USD'
      },
      positions: [],
      history: [],
      settings: {
        initialBalance: 50000,
        leverage: 200
      }
    };
  } else {
    store.users.demo.role = 'TRADER';
    store.users.demo.password = 'Sai@987654321';
  }

  if (!store.activeUserId) {
    store.activeUserId = 'vatsal1327@gmail.com';
  }
}

export function getStore(userId?: string): StoreData {
  if (isTestEnv && memoryStore) {
    ensureUserStructure(memoryStore);
    const targetId = userId || 'admin';
    if (memoryStore.users?.[targetId]) {
      const u = memoryStore.users[targetId];
      return {
        account: u.account,
        positions: u.positions,
        history: u.history,
        signals: memoryStore.signals,
        settings: u.settings,
        users: memoryStore.users,
        activeUserId: targetId
      };
    }
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

  ensureUserStructure(memoryStore!);

  const targetId = userId || 'admin';
  if (memoryStore!.users?.[targetId]) {
    const u = memoryStore!.users[targetId];
    return {
      account: u.account,
      positions: u.positions,
      history: u.history,
      signals: memoryStore!.signals,
      settings: u.settings,
      users: memoryStore!.users,
      activeUserId: targetId
    };
  }

  return memoryStore!;
}

export function saveStore(store: StoreData, userId?: string): void {
  const master = memoryStore || store;
  ensureUserStructure(master);

  // If saving for a specific user, ensure their slice is synced into users[userId]
  const targetId = userId || store.activeUserId || 'admin';
  if (master.users && master.users[targetId]) {
    if (store.activeUserId === targetId) {
      master.users[targetId].account = store.account;
      master.users[targetId].positions = store.positions;
      master.users[targetId].history = store.history;
      master.users[targetId].settings = store.settings;
    }
  }

  // Merge any new users from store into master
  if (store.users) {
    master.users = { ...master.users, ...store.users };
  }

  // Mirror admin slice to top-level legacy fields
  if (master.users && master.users.admin) {
    master.account = master.users.admin.account;
    master.positions = master.users.admin.positions;
    master.history = master.users.admin.history;
    master.settings = master.users.admin.settings;
  }

  memoryStore = master;

  if (isTestEnv) {
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(master, null, 2), 'utf-8');
    try {
      const stats = fs.statSync(STORE_FILE);
      lastDiskMtimeMs = stats.mtimeMs;
    } catch {}
  } catch (err) {
    // Non-fatal if read-only filesystem, memory store continues working
    console.error('Error saving store to disk:', err);
  }
}

export function getUser(userId: string): UserRecord | undefined {
  const store = getStore();
  return store.users?.[userId];
}

export function getUserByUsername(username: string): UserRecord | undefined {
  const store = getStore();
  if (!store.users) return undefined;
  const clean = username.trim().toLowerCase();
  return Object.values(store.users).find(
    (u) => u.username.toLowerCase() === clean || u.id.toLowerCase() === clean
  );
}

export function createUser(
  username: string,
  password: string,
  initialBalance = 100000,
  leverage = 100
): UserRecord {
  const store = getStore();
  ensureUserStructure(store);

  const cleanUsername = username.trim();
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  const existing = getUserByUsername(cleanUsername);
  if (existing) {
    throw new Error(`Username "${cleanUsername}" is already taken`);
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  const accountNumber = `EX-${randomNum}`;

  const newAccount: AccountState = {
    balance: initialBalance,
    equity: initialBalance,
    marginUsed: 0,
    freeMargin: initialBalance,
    marginLevel: 0,
    unrealizedPnL: 0,
    realizedPnL: 0,
    leverage,
    currency: 'USD'
  };

  const newUser: UserRecord = {
    id,
    username: cleanUsername,
    password: password.trim(),
    role: 'TRADER',
    accountNumber,
    createdAt: Date.now(),
    account: newAccount,
    positions: [],
    history: [],
    settings: {
      initialBalance,
      leverage
    }
  };

  store.users![id] = newUser;
  saveStore(store);

  return newUser;
}

export function getAllUserProfiles(): UserProfile[] {
  const store = getStore();
  if (!store.users) return [];
  return Object.values(store.users).map((u) => ({
    id: u.id,
    username: u.username,
    role: (u.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'TRADER') as 'ADMIN' | 'TRADER',
    accountNumber: u.accountNumber,
    createdAt: u.createdAt
  }));
}

export function setMemoryStoreOnly(store: StoreData): void {
  ensureUserStructure(store);
  memoryStore = store;
}
