import React, { useEffect, useState } from 'react';
import { AdhigaramList } from '@/components/AdhigaramList';
import { getDatabase } from '@/utils/database';
import * as SQLite from 'expo-sqlite';

interface Adhigaram {
  id: number;
  title: string;
}

export default function PorulScreen() {
  const [adhigarams, setAdhigarams] = useState<Adhigaram[]>([]);

  useEffect(() => {
    const fetchAdhigarams = async () => {
      const db = await getDatabase();
      if (db) {
        db.transaction((tx: any) => {
          tx.executeSql(
            'SELECT DISTINCT kno, title FROM tirukkural WHERE pal = "பொருட்பால்" ORDER BY kno',
            [],
            (_, { rows }: { rows: any }) => {
              setAdhigarams(
                rows._array.map((row: { kno: number; title: string }) => ({
                  id: row.kno,
                  title: row.title,
                }))
              );
            }
          );
        });
      }
    };

    fetchAdhigarams();
  }, []);

  return <AdhigaramList adhigarams={adhigarams} pal="porul" />;
}