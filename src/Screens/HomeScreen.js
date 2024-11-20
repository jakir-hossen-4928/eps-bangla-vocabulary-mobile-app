import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LanguageToggle from '../Components/LanguageToggle';
import SearchCard from '../Components/SearchCard';
import ResultCard from '../Components/ResultCard';

const HomeScreen = () => {
  const [searchResult, setSearchResult] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('Bangla');
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = useCallback((result) => {
    setSearchResult(result);
  }, []);

  const handleClear = useCallback(() => {
    setSearchResult([]);
  }, []);

  const handleLanguageChange = useCallback((language) => {
    setSelectedLanguage(language);
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      setSearchResult([]);
      setTimeout(() => {
        setRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <LanguageToggle onLanguageChange={handleLanguageChange} />
        <SearchCard
          onSearch={handleSearch}
          onClear={handleClear}
          selectedLanguage={selectedLanguage}
        />
        <ResultCard searchResult={searchResult} refreshing={refreshing} onRefresh={refreshData} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
});

export default HomeScreen;
