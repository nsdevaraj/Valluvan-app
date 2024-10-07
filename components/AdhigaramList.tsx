import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Adhigaram {
  id: number;
  title: string;
}

interface AdhigaramListProps {
  adhigarams: Adhigaram[];
  pal: string;
}

export function AdhigaramList({ adhigarams, pal }: AdhigaramListProps) {
  const router = useRouter();

  const renderItem = ({ item }: { item: Adhigaram }) => (
    <TouchableOpacity
      onPress={() => router.push(`/kural/${pal}/${item.id}`)}
      style={styles.item}
    >
      <ThemedText>{item.title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={adhigarams}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});