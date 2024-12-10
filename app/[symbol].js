import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

const API_KEY = "ct9sq51r01quh43oro60ct9sq51r01quh43oro6g";
const BASE_URL = "https://finnhub.io/api/v1";

export default function StockDetails() {
  const params = useLocalSearchParams();
  const symbol = params.symbol || "Unknown Symbol";
  const [stockData, setStockData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockDetails = async () => {
      try {
        // Fetch stock metrics
        const metricRes = await fetch(`${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`);
        const metricData = await metricRes.json();

        // Fetch stock prices
        const quoteRes = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
        const quoteData = await quoteRes.json();

        // Fetch historical data for the graph
        const historyRes = await fetch(
          `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${Math.floor(
            Date.now() / 1000 - 30 * 24 * 60 * 60 // 30 days ago
          )}&to=${Math.floor(Date.now() / 1000)}&token=${API_KEY}`
        );
        const historyData = await historyRes.json();

        setStockData({
          marketCap: metricData.metric?.marketCapitalization || "N/A",
          currentPrice: quoteData.c || "N/A",
          openPrice: quoteData.o || "N/A",
          highPrice: quoteData.h || "N/A",
          lowPrice: quoteData.l || "N/A",
          previousClose: quoteData.pc || "N/A",
        });

        if (historyData.s === "ok") {
          setGraphData(historyData.c); // Closing prices
        } else {
          setGraphData([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [symbol]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{symbol}</Text>
      <Text style={styles.subtitle}>Stock Overview</Text>

      {graphData.length > 0 ? (
        <LineChart
          data={{
            labels: graphData.map((_, idx) => `Day ${idx + 1}`),
            datasets: [
              {
                data: graphData,
              },
            ],
          }}
          width={Dimensions.get("window").width - 30}
          height={220}
          chartConfig={{
            backgroundColor: "#e26a00",
            backgroundGradientFrom: "#fb8c00",
            backgroundGradientTo: "#ffa726",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726",
            },
          }}
          bezier
          style={styles.graph}
        />
      ) : (
        <Text style={styles.info}>No historical data available for the graph.</Text>
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.detail}>Market Cap: {stockData.marketCap}</Text>
        <Text style={styles.detail}>Current Price: ${stockData.currentPrice}</Text>
        <Text style={styles.detail}>Open Price: ${stockData.openPrice}</Text>
        <Text style={styles.detail}>High Price: ${stockData.highPrice}</Text>
        <Text style={styles.detail}>Low Price: ${stockData.lowPrice}</Text>
        <Text style={styles.detail}>Previous Close: ${stockData.previousClose}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  graph: {
    marginVertical: 15,
    borderRadius: 16,
  },
  detailsContainer: {
    marginTop: 20,
  },
  detail: {
    fontSize: 16,
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});
