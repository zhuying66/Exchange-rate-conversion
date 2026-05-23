import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  fetchLatestRates,
  convertCurrency,
  POPULAR_CURRENCIES,
  refreshRates,
  startAutoRefresh,
  stopAutoRefresh,
} from '../services/api';
import CurrencyPicker from '../components/CurrencyPicker';

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ConverterScreen() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('CNY');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pickerTarget, setPickerTarget] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const loadRates = useCallback(async (showFullLoading = false) => {
    try {
      if (showFullLoading) setLoading(true);
      setError('');
      const data = await fetchLatestRates(fromCurrency);
      setRates(data.rates || {});
      setRefreshedAt(new Date());
    } catch {
      setError('Network error. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromCurrency]);

  const doConvert = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setResult(null);
      return;
    }
    try {
      setError('');
      const data = await convertCurrency(amount, fromCurrency, toCurrency);
      if (data.rates && data.rates[toCurrency] !== undefined) {
        setResult(data.rates[toCurrency]);
      }
    } catch {
      setError('Conversion failed. Please retry.');
    }
  }, [amount, fromCurrency, toCurrency]);

  useEffect(() => {
    loadRates(true);
  }, [loadRates]);

  useEffect(() => {
    doConvert();
  }, [doConvert]);

  const onRefreshRef = useRef(() => loadRates(false));
  onRefreshRef.current = () => loadRates(false);

  useEffect(() => {
    startAutoRefresh(30000, () => onRefreshRef.current());
    return () => stopAutoRefresh();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRates();
    } catch {}
    loadRates(false);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const rateValue = rates[toCurrency];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4A90D9"
          colors={['#4A90D9']}
        />
      }
    >
      <Text style={styles.title}>Currency Converter</Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="Enter amount"
        placeholderTextColor="#999"
        selectTextOnFocus
      />

      <Text style={styles.label}>From</Text>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setPickerTarget('from')}
      >
        <Text style={styles.pickerBtnText}>
          {POPULAR_CURRENCIES.find((c) => c.code === fromCurrency)?.flag}{' '}
          {POPULAR_CURRENCIES.find((c) => c.code === fromCurrency)?.label ||
            fromCurrency}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.swapBtn} onPress={swapCurrencies}>
        <Text style={styles.swapBtnText}>Swap Currencies</Text>
      </TouchableOpacity>

      <Text style={styles.label}>To</Text>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setPickerTarget('to')}
      >
        <Text style={styles.pickerBtnText}>
          {POPULAR_CURRENCIES.find((c) => c.code === toCurrency)?.flag}{' '}
          {POPULAR_CURRENCIES.find((c) => c.code === toCurrency)?.label ||
            toCurrency}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#4A90D9"
          style={{ marginTop: 20 }}
        />
      )}

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {result !== null && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Result</Text>
          <Text style={styles.resultAmount}>
            {parseFloat(amount).toLocaleString()} {fromCurrency}
          </Text>
          <Text style={styles.equals}>=</Text>
          <Text style={styles.resultConverted}>
            {result.toFixed(2)} {toCurrency}
          </Text>
          {rateValue && (
            <Text style={styles.rateInfo}>
              1 {fromCurrency} = {rateValue.toFixed(4)} {toCurrency}
            </Text>
          )}
          {refreshedAt && (
            <Text style={styles.updateInfo}>
              Last updated: {formatTime(refreshedAt)}
            </Text>
          )}
        </View>
      )}

      <CurrencyPicker
        visible={pickerTarget !== null}
        currencies={POPULAR_CURRENCIES}
        selected={pickerTarget === 'from' ? fromCurrency : toCurrency}
        onSelect={(code) => {
          if (pickerTarget === 'from') {
            setFromCurrency(code);
          } else {
            setToCurrency(code);
          }
          setPickerTarget(null);
        }}
        onClose={() => setPickerTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A90D9',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    color: '#666',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#F5F5F5',
    color: '#333',
    fontSize: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerBtn: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerBtnText: {
    color: '#333',
    fontSize: 18,
  },
  swapBtn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A90D9',
    borderRadius: 20,
  },
  swapBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  resultBox: {
    marginTop: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultLabel: {
    color: '#999',
    fontSize: 13,
    marginBottom: 8,
  },
  resultAmount: {
    color: '#666',
    fontSize: 18,
  },
  equals: {
    color: '#4A90D9',
    fontSize: 24,
    marginVertical: 6,
  },
  resultConverted: {
    color: '#333',
    fontSize: 32,
    fontWeight: '700',
  },
  rateInfo: {
    color: '#999',
    fontSize: 13,
    marginTop: 10,
  },
  updateInfo: {
    color: '#4A90D9',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
});
