export type User = {
  xrplAddress: string;
  name: string;
  createdAt: string;
  tokenCount?: number;
  poolCount?: number;
  // Training progress fields
  tokenCurrency?: string;   // e.g. 'USD' or 40-char hex
  tokenIssuer?: string;     // issuer wallet address
  ammAccount?: string;      // AMM pool's own XRPL account address
};

let users: User[] = [];

export const clearMemory = (): void => {
  users = [];
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

  // Check if new name conflicts with existing user
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

  return users[userIndex];
};

export const DeleteUser = async (xrplAddress: string): Promise<boolean> => {
  const userIndex = users.findIndex((user) => user.xrplAddress === xrplAddress);

  if (userIndex === -1) {
    return false;
  }

  users.splice(userIndex, 1);
  return true;
};

export default {
  AddUser,
  GetUsers,
  UpdateUser,
  DeleteUser,
  clearMemory,
};
