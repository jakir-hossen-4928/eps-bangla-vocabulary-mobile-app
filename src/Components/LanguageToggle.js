import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';

const LanguageToggle = ({ onLanguageChange }) => {
  const [isBangla, setIsBangla] = useState(true);

  const handleToggle = () => {
    setIsBangla(!isBangla);
    onLanguageChange(!isBangla ? 'Bangla' : 'Korean');
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Image
          source={isBangla ? require('../../assets/banglades.jpg') : require('../../assets/korea.jpg')}
          style={styles.flag}
        />
        <Text style={styles.label}>{isBangla ? 'Bangla' : 'Korean'}</Text>
      </View>

      <TouchableOpacity onPress={handleToggle} style={styles.toggleButton}>
        <Octicons name="arrow-switch" size={24} color="#101010" />
      </TouchableOpacity>

      <View style={styles.labelContainer}>
        <Image
          source={!isBangla ? require('../../assets/banglades.jpg') : require('../../assets/korea.jpg')}
          style={styles.flag}
        />
        <Text style={styles.label}>{!isBangla ? 'Bangla' : 'Korean'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#333',
    fontSize: 16,
    marginHorizontal: 8,
  },
  flag: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  toggleButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default LanguageToggle;
