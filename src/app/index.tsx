import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';

export default function App() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const getTodos = async () => {
      try {
        const { data: todosData, error } = await supabase.from('todos').select();

        if (error) {
          console.error('Error fetching todos:', error.message);
          setErrorMsg(error.message);
          return;
        }

        if (todosData) {
          setTodos(todosData);
        }
      } catch (error: any) {
        console.error('Error fetching todos:', error.message);
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };

    getTodos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GoviGana — Supabase Todo Test</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" />
      ) : errorMsg ? (
        <Text style={styles.errorText}>Error: {errorMsg}</Text>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <Text style={styles.todoItem}>{item.name}</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No todos found in the database.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E7D32',
  },
  todoItem: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    width: 300,
    textAlign: 'left',
  },
  errorText: {
    color: '#D32F2F',
    margin: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#757575',
    marginTop: 20,
    fontSize: 15,
  }
});
