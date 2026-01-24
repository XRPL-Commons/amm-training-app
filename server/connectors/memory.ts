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

export default {
  AddUser,
  GetUsers,
  clearMemory,
};
