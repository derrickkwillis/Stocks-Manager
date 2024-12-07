import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTopStocks } from '../utils/api'; // Use the real API function

const ITEMS_PER_PAGE = 10;

export default function IndexScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const top50 = await fetchTopStocks();
        console.log("Fetched Stocks:", top50); // Debug: Check what data is returned
        if (top50 && top50.length > 0) {
          setAllStocks(top50);
        } else {
          // If top50 is empty or not returned properly
          setAllStocks([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'red'}}>Error: {error}</Text>
      </View>
    );
  }

  // Filter stocks based on the search query using startsWith
  const filteredStocks = allStocks.filter(stock =>
    stock.symbol.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE);
  console.log("Filtered stocks:", filteredStocks.length);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedStocks = filteredStocks.slice(startIndex, endIndex);

  const isFavorite = (symbol) => favorites.includes(symbol);

  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        // Remove from favorites
        return prev.filter(item => item !== symbol);
      } else {
        // Add to favorites
        return [...prev, symbol];
      }
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by symbol..."
        value={searchQuery}
        onChangeText={text => {
          setSearchQuery(text);
          setPage(1); // Reset to first page on search
        }}
      />

      {
        // If there are no stocks at all (API returned empty) and search is empty
        (!loading && !error && allStocks.length === 0 && searchQuery.trim() === '') ? (
          <View style={{ padding: 20 }}>
            <Text>No data returned from the server.</Text>
          </View>
        ) : (
          <FlatList
            data={displayedStocks}
            keyExtractor={item => item.symbol}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <View style={styles.stockInfo}>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text>Market Cap: {item.marketCap}</Text>
                  <Text>Price: ${item.currentPrice !== null ? item.currentPrice.toFixed(2) : 'N/A'}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(item.symbol)}>
                  <Ionicons
                    name={isFavorite(item.symbol) ? "star" : "star-outline"}
                    size={24}
                    color="gold"
                  />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ padding: 20 }}>
                <Text>No stocks found.</Text>
              </View>
            }
          />
        )
      }

      {filteredStocks.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={() => setPage(page - 1)}
            disabled={page <= 1}
            style={[styles.button, page <= 1 && styles.disabledButton]}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} of {totalPages || 1}
          </Text>

          <TouchableOpacity
            onPress={() => setPage(page + 1)}
            disabled={page >= totalPages}
            style={[styles.button, page >= totalPages && styles.disabledButton]}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 10, backgroundColor: '#fff' },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10
  },
  itemContainer: {
    flexDirection: 'row', 
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stockInfo: {
    flexShrink: 1,
  },
  symbol: {
    fontWeight: 'bold'
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: 10
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  pageInfo: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});
