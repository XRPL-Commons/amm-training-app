export type User = {
  xrplAddress: string;
  name: string;
  createdAt: string;
};

let users: User[] = [];

export const AddUser = async (userObject: User) => {
  // Verify user is not already in the list
  const userExists = users.find(
    (user) =>
      user.xrplAddress === userObject.xrplAddress && user.name === userObject.name
  );

  if (userExists) {
    console.error('User already exists');
    throw new Error('User already exists');
  }

  users.push(userObject);

  console.log(`New User added with address: ${userObject.xrplAddress}`);
  console.log(userObject);
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

  console.log(result);
  return result;
};

export default {
  AddUser,
  GetUsers,
};
