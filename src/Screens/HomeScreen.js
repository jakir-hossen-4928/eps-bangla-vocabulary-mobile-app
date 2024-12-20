import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LanguageToggle from '../Components/LanguageToggle';
import SearchCard from '../Components/SearchCard';
import ResultCard from '../Components/ResultCard';

const HomeScreen = () => {
  const [searchResult, setSearchResult] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('Bangla');
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Handle Search Logic
  const handleSearch = useCallback(async (query) => {
    setIsSearching(true); // Show loading indicator
    try {
      // Simulating API call or heavy computation
      const result = await new Promise((resolve) =>
        setTimeout(() => resolve([`Result for ${query} in ${selectedLanguage}`]), 1500)
      );
      setSearchResult(result);
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedLanguage]);

  // Clear Search Results
  const handleClear = useCallback(() => {
    setSearchResult([]);
  }, []);

  // Change Language
  const handleLanguageChange = useCallback((language) => {
    setSelectedLanguage(language);
  }, []);

  // Refresh Data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      setSearchResult([]); // Clear existing results
      // Simulating a refresh action
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Memoized Loading Indicator
  const loadingIndicator = useMemo(
    () => isSearching && <ActivityIndicator size="large" color="#007BFF" style={styles.loading} />,
    [isSearching]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Language Toggle Component */}
        <LanguageToggle onLanguageChange={handleLanguageChange} />

        {/* Search Card Component */}
        <SearchCard
          onSearch={handleSearch}
          onClear={handleClear}
          selectedLanguage={selectedLanguage}
        />

        {/* Loading Indicator */}
        {loadingIndicator}

        {/* Results Card Component */}
        <ResultCard
          searchResult={searchResult}
          refreshing={refreshing}
          onRefresh={refreshData}
        />
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
  loading: {
    marginVertical: 10,
    alignSelf: 'center',
  },
});

export default HomeScreen;
