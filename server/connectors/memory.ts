import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type User = {
  xrplAddress: string;
  name: string;
  createdAt: string;
};

const DATA_FILE = join(process.cwd(), 'data', 'users.json');

let users: User[] = [];

export const loadMemory = (): void => {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(data);
    }
  } catch {
    users = [];
  }
};

export const saveMemory = (): void => {
  try {
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch {
    // Silently fail if unable to save
  }
};

export const clearMemory = (): void => {
  users = [];
  saveMemory();
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
  saveMemory();
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

// Load data on module initialization
loadMemory();

export default {
  AddUser,
  GetUsers,
  loadMemory,
  saveMemory,
  clearMemory,
};
