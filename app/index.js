import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { fetchQuote } from '../utils/api';

export default function HomeScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test fetching a single stock quote
    const loadQuote = async () => {
      try {
        const quoteData = await fetchQuote("AAPL");
        setData(quoteData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, []);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text>Apple Stock Quote:</Text>
      <Text>Current Price: {data.c}</Text>
      <Text>Open: {data.o}</Text>
      <Text>High: {data.h}</Text>
      <Text>Low: {data.l}</Text>
      <Text>Previous Close: {data.pc}</Text>
    </View>
  );
}
