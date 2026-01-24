export type User = {
  xrplAddress: string;
  name: string;
  createdAt: string;
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
  updates: { name?: string }
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
