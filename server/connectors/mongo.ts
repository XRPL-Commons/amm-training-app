import { MongoClient, Db, Collection } from 'mongodb';

export type User = {
  xrplAddress: string;
  name: string;
  createdAt: string;
};

let client: MongoClient | null = null;
let db: Db | null = null;

const getDb = async (): Promise<Db> => {
  if (db) return db;

  const uri = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017';
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('amm-training');
  return db;
};

const getUsersCollection = async (): Promise<Collection<User>> => {
  const database = await getDb();
  return database.collection<User>('users');
};

export const AddUser = async (userObject: User): Promise<User> => {
  const collection = await getUsersCollection();

  const userExists = await collection.findOne({
    $or: [
      { xrplAddress: userObject.xrplAddress },
      { name: userObject.name }
    ]
  });

  if (userExists) {
    throw new Error('User already exists');
  }

  await collection.insertOne(userObject);
  return userObject;
};

export const GetUsers = async (
  xrplAddress?: string,
  name?: string
): Promise<Array<User>> => {
  const collection = await getUsersCollection();

  const query: Record<string, string> = {};
  if (xrplAddress) query.xrplAddress = xrplAddress;
  if (name) query.name = name;

  const users = await collection.find(query).toArray();
  return users;
};

export const closeConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};

export default {
  AddUser,
  GetUsers,
  closeConnection,
};
