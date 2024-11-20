import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const FavoritesContext = createContext();

// Create a provider component
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from AsyncStorage on component mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites !== null) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (updatedFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = (item) => {
    const isInFavorites = favorites.some(
      (fav) => fav.bangla === item.bangla && fav.korean === item.korean
    );

    let updatedFavorites;
    if (!isInFavorites) {
      updatedFavorites = [...favorites, { ...item, timestamp: Date.now() }];
    } else {
      updatedFavorites = favorites.filter(
        (fav) => !(fav.bangla === item.bangla && fav.korean === item.korean)
      );
    }
    saveFavorites(updatedFavorites);
  };

  const removeFavorite = (item) => {
    const updatedFavorites = favorites.filter(
      (fav) => !(fav.bangla === item.bangla && fav.korean === item.korean)
    );
    saveFavorites(updatedFavorites);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loadFavorites,
        toggleFavorite,
        removeFavorite
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
