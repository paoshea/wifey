import clientPromise from './client';

async function createIndexes() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // CoveragePoints collection indexes
    await db.collection('coveragepoints').createIndex({ 'location': '2dsphere' });
    await db.collection('coveragepoints').createIndex({ 'timestamp': 1 });
    await db.collection('coveragepoints').createIndex({ 'provider': 1 });
    await db.collection('coveragepoints').createIndex({ 'type': 1 });

    // WifiHotspots collection indexes
    await db.collection('wifihotspots').createIndex({ 'location': '2dsphere' });
    await db.collection('wifihotspots').createIndex({ 'provider': 1 });
    await db.collection('wifihotspots').createIndex({ 'isPublic': 1 });
    await db.collection('wifihotspots').createIndex({ 'lastVerified': 1 });

    // Measurements collection indexes
    await db.collection('measurements').createIndex({ 'location': '2dsphere' });
    await db.collection('measurements').createIndex({ 'userId': 1 });
    await db.collection('measurements').createIndex({ 'timestamp': 1 });
    await db.collection('measurements').createIndex({ 'type': 1 });

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}

export default createIndexes;