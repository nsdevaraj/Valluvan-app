import React, { useEffect, useState } from 'react';
import { AdhigaramList } from '@/components/AdhigaramList';
import { getDatabase } from '@/utils/database';

export default function InbamScreen() {
  const [adhigarams, setAdhigarams] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT DISTINCT kno, title FROM tirukkural WHERE pal = "காமத்துப்பால்" ORDER BY kno',
        [],
        (_, { rows }) => {
          setAdhigarams(rows._array.map((row) => ({ id: row.kno, title: row.title })));
        }
      );
    });
  }, []);

  return <AdhigaramList adhigarams={adhigarams} pal="inbam" />;
}