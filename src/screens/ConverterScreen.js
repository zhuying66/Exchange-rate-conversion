import React, { useState, useEffect, useCallback } from 'react';
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
} from '../services/api';
import CurrencyPicker from '../components/CurrencyPicker';

export default function ConverterScreen() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('CNY');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pickerTarget, setPickerTarget] = useState(null); // 'from' | 'to'
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadRates = useCallback(async (showFullLoading = false) => {
    try {
      if (showFullLoading) setLoading(true);
      setError('');
      const data = await fetchLatestRates(fromCurrency);
      setRates(data.rates || {});
      setLastUpdated(new Date(data.date));
    } catch {
      setError('网络错误，请检查网络后下拉刷新');
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
      setError('转换失败，请重试');
    }
  }, [amount, fromCurrency, toCurrency]);

  // 初始加载 + 来源货币变化时重新获取汇率
  useEffect(() => {
    loadRates(true);
  }, [loadRates]);

  // 金额或目标货币变化时重新计算
  useEffect(() => {
    doConvert();
  }, [doConvert]);

  const onRefresh = () => {
    setRefreshing(true);
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
          tintColor="#00d2ff"
          colors={['#00d2ff']}
        />
      }
    >
      {/* 标题 */}
      <Text style={styles.title}>实时汇率转换</Text>

      {/* 输入金额 */}
      <Text style={styles.label}>金额</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="输入金额"
        placeholderTextColor="#555"
        selectTextOnFocus
      />

      {/* 来源货币 */}
      <Text style={styles.label}>从</Text>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setPickerTarget('from')}
      >
        <Text style={styles.pickerBtnText}>
          {POPULAR_CURRENCIES.find((c) => c.code === fromCurrency)?.label ||
            fromCurrency}
        </Text>
      </TouchableOpacity>

      {/* 交换按钮 */}
      <TouchableOpacity style={styles.swapBtn} onPress={swapCurrencies}>
        <Text style={styles.swapBtnText}>↑↓ 交换货币</Text>
      </TouchableOpacity>

      {/* 目标货币 */}
      <Text style={styles.label}>到</Text>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setPickerTarget('to')}
      >
        <Text style={styles.pickerBtnText}>
          {POPULAR_CURRENCIES.find((c) => c.code === toCurrency)?.label ||
            toCurrency}
        </Text>
      </TouchableOpacity>

      {/* 加载状态 */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#00d2ff"
          style={{ marginTop: 20 }}
        />
      )}

      {/* 错误提示 */}
      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {/* 转换结果 */}
      {result !== null && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>转换结果</Text>
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
          {lastUpdated && (
            <Text style={styles.updateInfo}>
              汇率日期: {lastUpdated.toLocaleDateString('zh-CN')}
            </Text>
          )}
        </View>
      )}

      {/* 快速查看常用汇率 */}
      {Object.keys(rates).length > 0 && !loading && (
        <View style={styles.quickRates}>
          <Text style={styles.quickRatesTitle}>
            1 {fromCurrency} 等于:
          </Text>
          {POPULAR_CURRENCIES.filter(
            (c) => c.code !== fromCurrency
          ).slice(0, 8).map((c) => (
            <View key={c.code} style={styles.rateRow}>
              <Text style={styles.rateCode}>{c.code}</Text>
              <Text style={styles.rateValue}>
                {rates[c.code]?.toFixed(4) || '-'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 货币选择弹窗 */}
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
    backgroundColor: '#0f0f23',
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00d2ff',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  pickerBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  pickerBtnText: {
    color: '#fff',
    fontSize: 18,
  },
  swapBtn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#16213e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00d2ff',
  },
  swapBtnText: {
    color: '#00d2ff',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#e94560',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  resultBox: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d2ff33',
  },
  resultLabel: {
    color: '#8888aa',
    fontSize: 13,
    marginBottom: 8,
  },
  resultAmount: {
    color: '#a0a0b8',
    fontSize: 18,
  },
  equals: {
    color: '#00d2ff',
    fontSize: 24,
    marginVertical: 6,
  },
  resultConverted: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  rateInfo: {
    color: '#666688',
    fontSize: 13,
    marginTop: 10,
  },
  updateInfo: {
    color: '#555570',
    fontSize: 11,
    marginTop: 4,
  },
  quickRates: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  quickRatesTitle: {
    color: '#8888aa',
    fontSize: 14,
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a4a',
  },
  rateCode: {
    color: '#c0c0d0',
    fontSize: 15,
    fontWeight: '500',
  },
  rateValue: {
    color: '#00d2ff',
    fontSize: 15,
  },
});
