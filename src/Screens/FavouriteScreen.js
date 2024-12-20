import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FavoritesContext } from '../lib/Context/FavoritesContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const FavoriteItem = React.memo(({ item, onRemove }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        damping: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
      }),
    ]).start();
  }, [scale]);

  const handleRemove = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
    }).start(() => onRemove(item));
  }, [item, onRemove, scale]);

  return (
    <AnimatedTouchable
      style={[styles.itemContainer, { transform: [{ scale }] }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.textContainer}>
          <Text style={styles.koreanText}>{item.korean}</Text>
          <Text style={styles.banglaText}>{item.bangla}</Text>
          <Text style={styles.timestampText}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteButton}
        >
          <MaterialCommunityIcons name="delete-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </AnimatedTouchable>
  );
});

const CategoryHeader = React.memo(({ title, count }) => (
  <View style={styles.categoryHeader}>
    <Text style={styles.categoryTitle}>{title}</Text>
    <View style={styles.countBadge}>
      <Text style={styles.countText}>{count}</Text>
    </View>
  </View>
));

const EmptyState = React.memo(() => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons name="heart-outline" size={64} color="#BDBDBD" />
    <Text style={styles.emptyTitle}>No Favorites Yet</Text>
    <Text style={styles.emptySubtitle}>
      Your favorite phrases will appear here
    </Text>
  </View>
));

const FavouriteScreen = () => {
  const { favorites, removeFavorite, loadFavorites } = useContext(FavoritesContext);
  const [refreshing, setRefreshing] = useState(false);

  const categorizedData = useMemo(() => {
    const sorted = [...favorites].sort((a, b) => b.timestamp - a.timestamp);
    const categorized = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    sorted.forEach((item) => {
      const itemDate = new Date(item.timestamp).setHours(0, 0, 0, 0);
      let category;

      if (itemDate === today) {
        category = "Today";
      } else if (itemDate === yesterday) {
        category = "Yesterday";
      } else {
        category = new Date(itemDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: now.getFullYear() !== new Date(itemDate).getFullYear() ? 'numeric' : undefined
        });
      }

      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(item);
    });

    return Object.entries(categorized).map(([category, items]) => ({
      category,
      data: items,
      count: items.length,
    }));
  }, [favorites]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

  const renderCategory = useCallback(({ item }) => (
    <View style={styles.categorySection}>
      <CategoryHeader title={item.category} count={item.count} />
      <FlatList
        data={item.data}
        renderItem={({ item: favoriteItem }) => (
          <FavoriteItem item={favoriteItem} onRemove={removeFavorite} />
        )}
        keyExtractor={item => item.timestamp.toString()}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  ), [removeFavorite]);

  return (
    <View style={styles.container}>
      <FlatList
        data={categorizedData}
        renderItem={renderCategory}
        keyExtractor={item => item.category}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={EmptyState}
        contentContainerStyle={[
          styles.listContent,
          !categorizedData.length && styles.emptyListContent
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  countBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  koreanText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  banglaText: {
    fontSize: 16,
    color: '#757575',
  },
  timestampText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});

export default React.memo(FavouriteScreen);