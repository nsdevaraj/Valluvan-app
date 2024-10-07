import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

let db: SQLite.SQLiteDatabase | null = null;

async function openDatabase(dbName: string): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    // Use openDatabaseSync for web platform
    return SQLite.openDatabaseSync(dbName);
  } else {
    return SQLite.openDatabaseAsync(dbName);
  }
}

export async function ensureDatabaseExists() {
  if (Platform.OS === 'web') {
    // Web platform doesn't need file system operations
    return;
  }

  const dbName = 'data.sqlite';
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, { intermediates: true });

    // Try to find the database file in the app bundle
    const asset = Asset.fromModule(require('../assets/db/data.sqlite'));
    try {
      await asset.downloadAsync();
      if (asset.localUri) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: dbPath
        });
      } else {
        console.error('Database asset does not have a local URI');
      }
    } catch (error) {
      console.error('Error copying database file:', error);
    }
  }
}

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db === null) {
    await ensureDatabaseExists();
    db = await openDatabase('data.sqlite');

    // Verify that the database object has the expected methods
    if (typeof (db as any).transaction !== 'function') {
      console.error('Database object does not have a transaction method');
      throw new Error('Invalid database object');
    }
  }
  return db;
};
