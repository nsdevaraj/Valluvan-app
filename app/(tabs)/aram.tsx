import React, { useEffect, useState } from 'react';
import { AdhigaramList } from '@/components/AdhigaramList';
import { ensureDatabaseExists, getDatabase } from '@/utils/database';
import * as SQLite from 'expo-sqlite';

interface Adhigaram {
  id: number;
  title: string;
}

export default function AramScreen() {
  const [adhigarams, setAdhigarams] = useState<Adhigaram[]>([]);

  useEffect(() => {
    async function fetchAdhigarams() {
      try {
        await ensureDatabaseExists();
        const db = getDatabase();
        db.transaction(
          (tx: SQLite.SQLTransaction) => {
            tx.executeSql(
              'SELECT DISTINCT kno, title FROM tirukkural WHERE pal = "அறத்துப்பால்" ORDER BY kno',
              [],
              (_: SQLite.SQLTransaction, { rows }: SQLite.SQLResultSet) => {
                setAdhigarams(
                  rows._array.map((row: any) => ({ id: row.kno, title: row.title }))
                );
              }
            );
          },
          (error: SQLite.SQLError) => {
            console.error('Transaction error:', error);
          }
        );
      } catch (error) {
        console.error('Error opening database:', error);
      }
    }

    fetchAdhigarams();
  }, []);

  return <AdhigaramList adhigarams={adhigarams} pal="aram" />;
}