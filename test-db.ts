import { MongoClient } from 'mongodb';

async function testCurrentPassword() {
  const uri = 'mongodb+srv://skot:mongodb2%40XYX@cluster0.zdeic8f.mongodb.net/?appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Success with %40');
  } catch (e) {
    console.error('Error with %40');
  } finally {
    await client.close();
  }
}

async function testNewPassword() {
  const uri = 'mongodb+srv://skot:mongodb2XYX@cluster0.zdeic8f.mongodb.net/?appName=Cluster0';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Success with missing @');
  } catch (e) {
    console.error('Error with missing @');
  } finally {
    await client.close();
  }
}

testCurrentPassword().then(testNewPassword);
