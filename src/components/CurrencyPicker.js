import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import translations from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

export default function CurrencyPicker({
  visible,
  currencies,
  selected,
  onSelect,
  onClose,
}) {
  const { lang } = useLanguage();
  const t = translations[lang];
  const label = (code) => t.currencies[code] || code;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t.selectCurrency}</Text>
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  selected === item.code && styles.itemSelected,
                ]}
                onPress={() => onSelect(item.code)}
              >
                <Text
                  style={[
                    styles.itemText,
                    selected === item.code && styles.itemTextSelected,
                  ]}
                >
                  {item.flag}  {label(item.code)}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  itemSelected: {
    backgroundColor: '#EEF3FA',
  },
  itemText: {
    color: '#666',
    fontSize: 16,
  },
  itemTextSelected: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#4A90D9',
    borderRadius: 10,
  },
  closeBtnText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
