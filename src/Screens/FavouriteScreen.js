import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FavoritesContext } from '../lib/Context/FavoritesContext';

const FavouriteScreen = ({ navigation }) => {
  const { favorites, removeFavorite, loadFavorites } = useContext(FavoritesContext);
  const [refreshing, setRefreshing] = useState(false);

  // Sort favorites once using useMemo to avoid unnecessary recalculations
  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) => b.timestamp - a.timestamp);
  }, [favorites]);

  // Categorize favorites
  const categorizeFavorites = (sortedFavorites) => {
    const categorized = {};
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    sortedFavorites.forEach((item) => {
      const itemDate = new Date(item.timestamp).setHours(0, 0, 0, 0);

      if (itemDate === today) {
        if (!categorized["Today"]) {
          categorized["Today"] = [];
        }
        categorized["Today"].push(item);
      } else if (itemDate === yesterday.getTime()) {
        if (!categorized["Yesterday"]) {
          categorized["Yesterday"] = [];
        }
        categorized["Yesterday"].push(item);
      } else {
        const key = new Date(item.timestamp).toLocaleDateString();
        if (!categorized[key]) {
          categorized[key] = [];
        }
        categorized[key].push(item);
      }
    });

    return categorized;
  };

  const categorizedFavorites = useMemo(() => categorizeFavorites(sortedFavorites), [sortedFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavorites();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [loadFavorites]);

  const renderFavoriteItem = useCallback(({ item }) => (
    <TouchableWithoutFeedback>
      <View style={styles.item}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemText}>Bangla: {item.bangla}</Text>
          <Text style={styles.itemText}>Korean: {item.korean}</Text>
        </View>
        <TouchableWithoutFeedback onPress={() => removeFavorite(item)}>
          <MaterialCommunityIcons
            name="delete"
            size={24}
            color="black"
            style={styles.removeIcon}
          />
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  ), [removeFavorite]);

  const renderCategory = ({ item }) => (
    <View>
      <Text style={styles.categoryHeading}>{item.category}</Text>
      <FlatList
        data={item.data}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.timestamp.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const categorizedData = useMemo(() => {
    return Object.keys(categorizedFavorites).map((key) => ({
      category: key,
      data: categorizedFavorites[key],
    }));
  }, [categorizedFavorites]);

  return (
    <View style={styles.container}>
      <FlatList
        data={categorizedData}
        renderItem={renderCategory}
        keyExtractor={(item) => item.category}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.noFavoritesContainer}>
            <Text style={styles.noFavorites}>No favorites added yet.</Text>
          </View>
        )}
        contentContainerStyle={styles.scrollView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoryHeading: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  item: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: {
    fontSize: 18,
    flex: 1,
    flexWrap: 'wrap',
    color: '#101010',
  },
  removeIcon: {
    padding: 5,
    color: '#101010',
  },
  noFavoritesContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  noFavorites: {
    fontSize: 18,
    fontStyle: "italic",
  },
  motivation: {
    fontSize: 16,
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
  },
});

export default FavouriteScreen;
