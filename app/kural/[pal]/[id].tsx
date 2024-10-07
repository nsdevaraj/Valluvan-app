import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ensureDatabaseExists, getDatabase } from '@/utils/database';
import * as SQLite from 'expo-sqlite';

interface Kural {
  kno: number;
  firstline: string;
  secondline: string;
  explanation: string;
}

export default function KuralScreen() {
  const { pal, id } = useLocalSearchParams<{ pal: string; id: string }>();
  const [kurals, setKurals] = useState<Kural[]>([]);

  useEffect(() => {
    async function fetchKurals() {
      try {
        await ensureDatabaseExists();
        const db = getDatabase();
        db.transaction(
          (tx: SQLite.SQLTransaction) => {
            tx.executeSql(
              'SELECT kno, firstline, secondline, explanation FROM tirukkural WHERE kno >= ? AND kno < ? + 10',
              [id, id],
              (_: SQLite.SQLTransaction, { rows }: SQLite.SQLResultSet) => {
                setKurals(rows._array as Kural[]);
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

    fetchKurals();
  }, [id]);

  const renderItem = ({ item }: { item: Kural }) => (
    <ThemedView style={styles.kuralContainer}>
      <ThemedText style={styles.kuralNumber}>குறள் {item.kno}</ThemedText>
      <ThemedText style={styles.kuralText}>{item.firstline}</ThemedText>
      <ThemedText style={styles.kuralText}>{item.secondline}</ThemedText>
      <ThemedText style={styles.explanation}>{item.explanation}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={kurals}
        renderItem={renderItem}
        keyExtractor={(item) => item.kno.toString()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  kuralContainer: {
    marginBottom: 24,
  },
  kuralNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kuralText: {
    fontSize: 16,
    marginBottom: 4,
  },
  explanation: {
    fontSize: 14,
    marginTop: 8,
  },
});