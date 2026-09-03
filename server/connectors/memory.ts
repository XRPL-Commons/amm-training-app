import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { createLogger } from '../utils/logger'

const log = createLogger('store')

export type User = {
  xrplAddress: string;
  name: string;
  createdAt: string;
  tokenCount?: number;
  poolCount?: number;
  tokenCurrency?: string;
  tokenIssuer?: string;
  ammAccount?: string;
};

// Persistent JSON file path — lives in project root's .data/ directory
const DATA_DIR = join(process.cwd(), '.data')
const STORE_PATH = join(DATA_DIR, 'users.json')

// In-memory cache (synced with disk)
let users: User[] = loadFromDisk()

function loadFromDisk(): User[] {
  try {
    if (existsSync(STORE_PATH)) {
      return JSON.parse(readFileSync(STORE_PATH, 'utf-8'))
    }
  } catch (e) {
    // Expected/handled: a missing or corrupt file just means an empty store.
    log.warn('failed to read users.json, starting fresh', { err: e, path: STORE_PATH })
  }
  return []
}

function persist(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true })
    }
    writeFileSync(STORE_PATH, JSON.stringify(users, null, 2))
  } catch (e) {
    // Unexpected: the write failed and data will be lost on restart.
    log.error('failed to persist users.json', { err: e, path: STORE_PATH })
  }
}

export const clearMemory = (): void => {
  users = [];
  persist();
};

export const AddUser = async (userObject: User): Promise<User> => {
  const userExists = users.find(
    (user) =>
      user.xrplAddress === userObject.xrplAddress || user.name === userObject.name
  );

  if (userExists) {
    throw new Error('User already exists');
  }

  users.push(userObject);
  persist();
  return userObject;
};

export const GetUsers = async (
  xrplAddress?: string,
  name?: string
): Promise<Array<User>> => {
  let result = users;

  if (xrplAddress) {
    result = result.filter((user) => user.xrplAddress === xrplAddress);
  }
  if (name) {
    result = result.filter((user) => user.name === name);
  }

  return result;
};

export const UpdateUser = async (
  xrplAddress: string,
  updates: { name?: string; tokenCount?: number; poolCount?: number; tokenCurrency?: string; tokenIssuer?: string; ammAccount?: string }
): Promise<User | null> => {
  const userIndex = users.findIndex((user) => user.xrplAddress === xrplAddress);

  if (userIndex === -1) {
    return null;
  }

  if (updates.name) {
    const nameExists = users.find(
      (user) => user.name === updates.name && user.xrplAddress !== xrplAddress
    );
    if (nameExists) {
      throw new Error('Name already taken');
    }
    users[userIndex].name = updates.name;
  }

  if (updates.tokenCount !== undefined) {
    users[userIndex].tokenCount = updates.tokenCount;
  }

  if (updates.poolCount !== undefined) {
    users[userIndex].poolCount = updates.poolCount;
  }

  if (updates.tokenCurrency !== undefined) {
    users[userIndex].tokenCurrency = updates.tokenCurrency;
  }

  if (updates.tokenIssuer !== undefined) {
    users[userIndex].tokenIssuer = updates.tokenIssuer;
  }

  if (updates.ammAccount !== undefined) {
    users[userIndex].ammAccount = updates.ammAccount;
  }

  persist();
  return users[userIndex];
};

export const DeleteUser = async (xrplAddress: string): Promise<boolean> => {
  const userIndex = users.findIndex((user) => user.xrplAddress === xrplAddress);

  if (userIndex === -1) {
    return false;
  }

  users.splice(userIndex, 1);
  persist();
  return true;
};

export default {
  AddUser,
  GetUsers,
  UpdateUser,
  DeleteUser,
  clearMemory,
};
