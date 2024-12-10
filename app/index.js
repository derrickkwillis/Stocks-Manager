import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTopStocks } from '../utils/api';
import { useRouter } from 'expo-router';


const ITEMS_PER_PAGE = 10;
const API_KEY = "ct9sq51r01quh43oro60ct9sq51r01quh43oro6g";
const BASE_URL = "https://finnhub.io/api/v1";

async function getMarketCap(symbol) {
  const url = `${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch market cap for ${symbol}`);
  }
  const data = await response.json();
  const cap = data.metric?.marketCapitalization;
  return typeof cap === "number" ? cap : null;
}

async function getCurrentPrice(symbol) {
  const url = `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${symbol}`);
  }
  const data = await response.json();
  return data.c; // 'c' is current price
}

export default function IndexScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);

  const [allStocks, setAllStocks] = useState([]);    // top 50 large-cap
  const [allSymbols, setAllSymbols] = useState([]);  // full symbol list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [combinedResults, setCombinedResults] = useState([]);
  const [enrichedResults, setEnrichedResults] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const top50 = await fetchTopStocks();
        console.log("Fetched Stocks:", top50);
        if (top50 && top50.length > 0) {
          setAllStocks(top50);
        } else {
          setAllStocks([]);
        }

        // Fetch all US symbols
        const res = await fetch(`${BASE_URL}/stock/symbol?exchange=US&token=${API_KEY}`);
        if (!res.ok) {
          throw new Error('Failed to fetch all symbols');
        }
        const fullData = await res.json();
        setAllSymbols(fullData); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const filteredStocks = allStocks.filter(s =>
      s.symbol.toLowerCase().startsWith(searchQuery.toLowerCase())
    );

    let filteredAllSymbols = [];
    if (searchQuery.trim() !== '') {
      filteredAllSymbols = allSymbols.filter(s =>
        s.symbol && s.symbol.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
    }

    let combined = [];
    if (searchQuery.trim() === '') {
      // No search, just show top 50
      combined = filteredStocks;
    } else {
      // Searching: combine top 50 matches and full symbol matches without duplicates
      const symbolSet = new Set();
      for (const item of filteredStocks) {
        symbolSet.add(item.symbol);
        combined.push(item);
      }
      for (const sym of filteredAllSymbols) {
        if (!symbolSet.has(sym.symbol)) {
          combined.push({
            symbol: sym.symbol,
            marketCap: null,
            currentPrice: null
          });
        }
      }
    }

    setCombinedResults(combined);
    setPage(1);
  }, [searchQuery, allStocks, allSymbols]);

  useEffect(() => {
    const fetchDetailsForNonTop50 = async () => {
      if (searchQuery.trim() === '') {
        setEnrichedResults(combinedResults);
        return;
      }

      const resultsCopy = [...combinedResults];
      const symbolsNeedingDetails = resultsCopy.filter(item => item.marketCap === null && item.currentPrice === null);

      for (const stock of symbolsNeedingDetails) {
        try {
          const marketCap = await getMarketCap(stock.symbol);
          const price = await getCurrentPrice(stock.symbol);
          stock.marketCap = marketCap;
          stock.currentPrice = price;
        } catch (error) {
          console.error(`Error fetching details for ${stock.symbol}:`, error);
        }
      }

      setEnrichedResults(resultsCopy);
    };

    fetchDetailsForNonTop50();
  }, [combinedResults, searchQuery]);

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

  const totalPages = Math.ceil(enrichedResults.length / ITEMS_PER_PAGE);
  console.log("Filtered combined results:", enrichedResults.length);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedStocks = enrichedResults.slice(startIndex, endIndex);

  const isFavorite = (symbol) => favorites.includes(symbol);

  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(item => item !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  // Placeholder function for handling item press
  const handleItemPress = (stock) => {
    // TODO: Implement navigation or show details screen when pressed
    router.push({
      pathname: `/${stock.symbol}`, // Navigate to the stock details page
    });
    console.log("Pressed on", stock.symbol);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by symbol..."
        value={searchQuery}
        onChangeText={text => {
          setSearchQuery(text);
          setPage(1);
        }}
      />

      {
        (!loading && !error && allStocks.length === 0 && searchQuery.trim() === '') ? (
          <View style={{ padding: 20 }}>
            <Text>No data returned from the server.</Text>
          </View>
        ) : (
          <FlatList
            data={displayedStocks}
            keyExtractor={item => item.symbol}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => handleItemPress(item)} 
                style={({ pressed }) => [{ backgroundColor: pressed ? '#e0e0e0' : '#fff' }]}
              >
                <View style={styles.itemContainer}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    {item.marketCap !== null && <Text>Market Cap: {item.marketCap}</Text>}
                    {item.currentPrice !== null && <Text>Price: ${item.currentPrice.toFixed(2)}</Text>}
                    {item.marketCap === null && item.currentPrice === null && (
                      <Text style={{ fontStyle: 'italic', color: '#999' }}>No detailed data</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(item.symbol)}>
                    <Ionicons
                      name={isFavorite(item.symbol) ? "star" : "star-outline"}
                      size={24}
                      color="gold"
                    />
                  </TouchableOpacity>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={{ padding: 20 }}>
                <Text>No stocks found.</Text>
              </View>
            }
          />
        )
      }

      {enrichedResults.length > 0 && (
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
