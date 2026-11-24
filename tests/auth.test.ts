import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUser,
  getUserByUsername,
  createUser,
  getStore,
  saveStore
} from '../src/lib/store';
import {
  executeOrder,
  getPositions,
  getAccountState,
  closePositionsByFilter
} from '../src/lib/market-engine';

describe('Multi-Tenant User Authentication & Isolation', () => {
  beforeEach(() => {
    // Reset store state
    const store = getStore();
    saveStore(store);
  });

  it('provides configured admin user with seeded account', () => {
    const admin = getUserByUsername('vatsal1327@gmail.com');
    expect(admin).toBeDefined();
    expect(admin?.username).toBe('vatsal1327@gmail.com');
    expect(admin?.role).toBe('ADMIN');
    expect(admin?.accountNumber).toBe('EX-9482104');
    expect(admin?.password).toBe('Bitcoin@100');

    const adminAccount = getAccountState('vatsal1327@gmail.com');
    expect(adminAccount.balance).toBeGreaterThan(0);
    expect(adminAccount.leverage).toBe(100);
  });

  it('provides configured user trader with seeded account', () => {
    const user = getUserByUsername('sai1327y@gmail.com');
    expect(user).toBeDefined();
    expect(user?.username).toBe('sai1327y@gmail.com');
    expect(user?.role).toBe('TRADER');
    expect(user?.accountNumber).toBe('EX-5582910');
    expect(user?.password).toBe('Sai@987654321');

    const userAccount = getAccountState('sai1327y@gmail.com');
    expect(userAccount.balance).toBe(50000);
    expect(userAccount.leverage).toBe(200);
  });

  it('allows registering a new user with custom balance and leverage', () => {
    const uniqueUsername = `trader_${Date.now()}`;
    const newUser = createUser(uniqueUsername, 'secretPass1', 25000, 200);

    expect(newUser.id).toBeDefined();
    expect(newUser.username).toBe(uniqueUsername);
    expect(newUser.role).toBe('TRADER');
    expect(newUser.accountNumber).toMatch(/^EX-\d{7}$/);

    const userAccount = getAccountState(newUser.id);
    expect(userAccount.balance).toBe(25000);
    expect(userAccount.equity).toBe(25000);
    expect(userAccount.leverage).toBe(200);
    expect(userAccount.freeMargin).toBe(25000);
  });

  it('rejects creating duplicate users', () => {
    expect(() => {
      createUser('admin', 'anyPassword');
    }).toThrow('already taken');
  });

  it('isolates trading positions and accounts between distinct users', () => {
    const userA = createUser(`user_a_${Date.now()}`, 'pass1234', 50000, 100);
    const userB = createUser(`user_b_${Date.now()}`, 'pass1234', 10000, 50);

    // User A executes a BUY order on XAUUSD
    const orderA = executeOrder(
      {
        symbol: 'XAUUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 1.0
      },
      userA.id
    );

    expect(orderA.id).toBeDefined();
    expect(orderA.status).toBe('OPEN');

    // User A should have 1 open position
    const positionsA = getPositions(userA.id);
    expect(positionsA.length).toBe(1);
    expect(positionsA[0].lots).toBe(1.0);

    // User B should have 0 open positions and unchanged balance
    const positionsB = getPositions(userB.id);
    expect(positionsB.length).toBe(0);

    const accountB = getAccountState(userB.id);
    expect(accountB.balance).toBe(10000);
    expect(accountB.marginUsed).toBe(0);
    expect(accountB.freeMargin).toBe(10000);

    // User B executes a BUY order on BTCUSD
    const orderB = executeOrder(
      {
        symbol: 'BTCUSD',
        side: 'BUY',
        type: 'MARKET',
        lots: 0.1
      },
      userB.id
    );

    expect(orderB.id).toBeDefined();
    expect(orderB.status).toBe('OPEN');

    // Verify isolation after both users have open positions
    expect(getPositions(userA.id).length).toBe(1);
    expect(getPositions(userA.id)[0].symbol).toBe('XAUUSD');

    expect(getPositions(userB.id).length).toBe(1);
    expect(getPositions(userB.id)[0].symbol).toBe('BTCUSD');

    // Closing User A's position does not affect User B
    const closed = closePositionsByFilter('ALL', userA.id);
    expect(closed.length).toBe(1);

    expect(getPositions(userA.id).length).toBe(0);
    expect(getPositions(userB.id).length).toBe(1);
  });
});
