import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

interface DatabaseSearchResult {
  id: number;
  heading: string;
  subheading: string;
  content: string;
  explanation: string;
  kuralId: number;
}

const KuralSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('English');
  const [searchResults, setSearchResults] = useState<DatabaseSearchResult[]>([]);
  const [relatedKurals, setRelatedKurals] = useState<DatabaseSearchResult[]>([]);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    initDatabase();
  }, []);

  useEffect(() => {
    if (query.length > 2 && db) {
      searchContent(query, language);
    } else {
      setSearchResults([]);
    }
  }, [query, language, db]);

  const initDatabase = async () => {
    const dbName = 'data.sqlite';
    const dbPath = FileSystem.documentDirectory + dbName;
    const fileInfo = await FileSystem.getInfoAsync(dbPath);

    if (!fileInfo.exists) {
      const asset = Asset.fromModule(require('../assets/data.sqlite'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri ?? '',
        to: dbPath
      });
    }

    const database = SQLite.openDatabaseSync(dbName);
    setDb(database);
  };

  const searchContent = (searchQuery: string, searchLanguage: string) => {
    if (!db) return;

    let searchSql = '';
    let params: string[] = [];

    if (searchLanguage !== 'English' && searchLanguage !== 'telugu' && searchLanguage !== 'hindi') {
      searchSql = `
        SELECT kno, heading, chapter, efirstline, esecondline, explanation, ${searchLanguage}
        FROM tirukkural
        WHERE heading LIKE ? OR chapter LIKE ? OR efirstline LIKE ? OR esecondline LIKE ? OR explanation LIKE ? OR ${searchLanguage} LIKE ?
        LIMIT 20
      `;
      params = Array(6).fill(`%${searchQuery}%`);
    } else {
      const langColumns = searchLanguage === 'English' ? ['efirstline', 'esecondline'] : [`${searchLanguage}1`, `${searchLanguage}2`];
      searchSql = `
        SELECT kno, heading, chapter, ${langColumns[0]}, ${langColumns[1]}, explanation
        FROM tirukkural
        WHERE heading LIKE ? OR chapter LIKE ? OR ${langColumns[0]} LIKE ? OR ${langColumns[1]} LIKE ? OR explanation LIKE ?
        LIMIT 20
      `;
      params = Array(5).fill(`%${searchQuery}%`);
    }

    db.transaction(tx => {
      tx.executeSql(
        searchSql,
        params,
        (_, { rows }) => {
          const results: DatabaseSearchResult[] = rows._array.map(row => ({
            id: row.kno,
            heading: row.heading,
            subheading: row.chapter,
            content: `${row[searchLanguage] || row[`${searchLanguage}1`] || row.efirstline}\n${row[`${searchLanguage}2`] || row.esecondline || ''}`,
            explanation: row.explanation,
            kuralId: row.kno
          }));
          setSearchResults(results);
        },
        (_, error) => {
          console.error('Error searching content:', error);
          return false;
        }
      );
    });
  };

  const findRelatedKurals = (kuralId: number) => {
    if (!db) return;

    const sql = `
      SELECT related_rows
      FROM tirukkural
      WHERE kno = ?
    `;

    db.transaction(tx => {
      tx.executeSql(
        sql,
        [kuralId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const relatedIds = rows.item(0).related_rows
              .replace(/[\[\]]/g, '')
              .split(',')
              .map((id: string) => parseInt(id.trim(), 10));
            fetchRelatedKurals(relatedIds);
          }
        },
        (_, error) => {
          console.error('Error finding related kurals:', error);
          return false;
        }
      );
    });
  };

  const fetchRelatedKurals = (relatedIds: number[]) => {
    if (!db) return;

    const placeholders = relatedIds.map(() => '?').join(',');
    const sql = `
      SELECT kno, heading, chapter, efirstline, esecondline, explanation
      FROM tirukkural
      WHERE kno IN (${placeholders})
    `;

    db.transaction(tx => {
      tx.executeSql(
        sql,
        relatedIds,
        (_, { rows }) => {
          const results: DatabaseSearchResult[] = rows._array.map(row => ({
            id: row.kno,
            heading: row.heading,
            subheading: row.chapter,
            content: `${row.efirstline}\n${row.esecondline}`,
            explanation: row.explanation,
            kuralId: row.kno
          }));
          setRelatedKurals(results);
        },
        (_, error) => {
          console.error('Error fetching related kurals:', error);
          return false;
        }
      );
    });
  };

  const ragSearch = () => {
    // Implement RAG search logic here
    console.log('RAG search not implemented yet');
  };

  const renderSearchResult = ({ item }: { item: DatabaseSearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => findRelatedKurals(item.kuralId)}>
      <Text style={styles.heading}>{item.heading}</Text>
      <Text style={styles.subheading}>{item.subheading}</Text>
      <Text style={styles.content}>{item.content}</Text>
      <Text style={styles.explanation}>{item.explanation}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search Kurals..."
      />
      <TouchableOpacity style={styles.ragButton} onPress={ragSearch}>
        <Text style={styles.ragButtonText}>RAG Search</Text>
      </TouchableOpacity>
      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id.toString()}
      />
      {relatedKurals.length > 0 && (
        <View style={styles.relatedKuralsContainer}>
          <Text style={styles.relatedKuralsTitle}>Related Kurals:</Text>
          <FlatList
            data={relatedKurals}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  ragButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  ragButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  resultItem: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subheading: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  content: {
    marginTop: 4,
  },
  explanation: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  relatedKuralsContainer: {
    marginTop: 16,
  },
  relatedKuralsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default KuralSearch;