import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Keyboard,
  Platform,
  Animated,
} from "react-native";
import { SearchBar } from "react-native-elements";
import { fetchAllVocabulary } from "../lib/appwrite/appwrite";
import NetInfo from "@react-native-community/netinfo";
import { FavoritesContext, useFavorites } from "../lib/Context/FavoritesContext";
import Loading from "../Components/Loading";
import debounce from "lodash/debounce";
import * as Speech from "expo-speech";
import {
  Feather,
  FontAwesome,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Constants
const BATCH_SIZE = 20;
const DEBOUNCE_DELAY = 300;
const ITEM_HEIGHT = 100; // Approximate height of each item

const VocabularyItem = React.memo(({
  item,
  index,
  isInFavorites,
  speakingIndex,
  onToggleFavorite,
  onSpeak
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onSpeak(item.korean, index);
  }, [onSpeak, item, index]);

  return (
    <Animated.View style={[styles.itemContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.item}
      >
        <View style={styles.textContainer}>
          <Text style={styles.koreanText}>{item.korean}</Text>
          <Text style={styles.banglaText}>{item.bangla}</Text>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={() => onToggleFavorite(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isInFavorites ? (
              <MaterialIcons name="favorite" size={24} color="#FF4081" />
            ) : (
              <MaterialIcons name="favorite-border" size={24} color="#757575" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePress}
            style={styles.speakerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {speakingIndex === index ? (
              <FontAwesome name="volume-up" size={24} color="#2196F3" />
            ) : (
              <Feather name="volume-1" size={24} color="#757575" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const LibraryScreen = () => {
  const { favorites, toggleFavorite } = useContext(FavoritesContext);
  const [isLoading, setIsLoading] = useState(true);
  const [vocabulary, setVocabulary] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastId, setLastId] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const flatListRef = useRef(null);
  const searchTimeout = useRef(null);

  // Network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
      if (!state.isConnected) {
        Alert.alert(
          "No Internet Connection",
          "Please check your internet connection and try again."
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial data fetch
  const initializeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchAllVocabulary();
      const uniqueVocab = filterUniqueVocabulary(response.documents);
      setVocabulary(uniqueVocab);
      setLastId(response.documents[response.documents.length - 1]?.$id);
    } catch (error) {
      console.error("Error fetching vocabulary:", error);
      Alert.alert("Error", "Failed to load vocabulary. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeData();
  }, []);

  // Unique vocabulary filter
  const filterUniqueVocabulary = useCallback((vocab) => {
    const seen = new Set();
    return vocab.filter((item) => {
      const key = item.$id || `${item.bangla}-${item.korean}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  // Search handling
  const handleSearch = useCallback(
    (text) => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      const lowerCaseInput = text.toLowerCase().trim();

      if (!lowerCaseInput) {
        setSearchResult([]);
        return;
      }

      searchTimeout.current = setTimeout(() => {
        const results = vocabulary.filter(
          (doc) =>
            doc.bangla.toLowerCase().includes(lowerCaseInput) ||
            doc.korean.toLowerCase().includes(lowerCaseInput)
        );

        setSearchResult(results);
      }, DEBOUNCE_DELAY);
    },
    [vocabulary]
  );

  // Infinite scroll handling
  const loadMoreVocabulary = useCallback(async () => {
    if (isFetchingMore || isOffline || searchResult.length > 0) return;

    try {
      setIsFetchingMore(true);
      const response = await fetchAllVocabulary(lastId);
      if (response.documents.length > 0) {
        const newVocab = filterUniqueVocabulary(response.documents);
        setVocabulary(prev => [...prev, ...newVocab]);
        setLastId(response.documents[response.documents.length - 1]?.$id);
      }
    } catch (error) {
      console.error("Error loading more vocabulary:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, lastId, isOffline, searchResult.length]);

  // Text-to-speech handling
  const speakText = useCallback((text, index) => {
    if (speakingIndex === index) {
      Speech.stop();
      setSpeakingIndex(null);
      return;
    }

    setSpeakingIndex(index);
    Speech.speak(text, {
      language: "ko-KR",
      voice: "ko-kr-x-kfn-local",
      pitch: 1.1,
      rate: 0.95,
      onDone: () => setSpeakingIndex(null),
      onError: () => {
        setSpeakingIndex(null);
        Alert.alert("Error", "Failed to play pronunciation. Please try again.");
      },
    });
  }, [speakingIndex]);

  // Memoized data for FlatList
  const listData = useMemo(() =>
    searchResult.length > 0 ? searchResult : vocabulary,
    [searchResult, vocabulary]
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  }, [initializeData]);

  // Render item for FlatList
  const renderItem = useCallback(({ item, index }) => {
    const isInFavorites = favorites.some(
      (fav) => fav.bangla === item.bangla && fav.korean === item.korean
    );

    return (
      <VocabularyItem
        item={item}
        index={index}
        isInFavorites={isInFavorites}
        speakingIndex={speakingIndex}
        onToggleFavorite={toggleFavorite}
        onSpeak={speakText}
      />
    );
  }, [favorites, speakingIndex, toggleFavorite, speakText]);

  // Empty list component
  const EmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="book-open-variant" size={64} color="#BDBDBD" />
      <Text style={styles.emptyText}>
        {inputValue ? "No results found" : "No vocabulary items available"}
      </Text>
    </View>
  ), [inputValue]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar
        placeholder="Search in Korean or Bangla..."
        onChangeText={(text) => {
          setInputValue(text);
          handleSearch(text);
        }}
        value={inputValue}
        platform={Platform.OS}
        containerStyle={styles.searchBarContainer}
        inputContainerStyle={styles.searchBarInputContainer}
        onClear={() => {
          setInputValue("");
          setSearchResult([]);
          Keyboard.dismiss();
        }}
        autoCorrect={false}
      />

      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="wifi-off" size={20} color="#fff" />
          <Text style={styles.offlineText}>You are offline</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.$id || `${item.bangla}-${item.korean}-${index}`}
        onEndReached={loadMoreVocabulary}
        onEndReachedThreshold={0.5}
        maxToRenderPerBatch={BATCH_SIZE}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={BATCH_SIZE}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        ListEmptyComponent={EmptyList}
        ListFooterComponent={
          isFetchingMore && (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#2196F3" />
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2196F3"]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  itemContainer: {
    margin: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  koreanText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  banglaText: {
    fontSize: 16,
    color: "#757575",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
  },
  speakerButton: {
    marginLeft: 16,
  },
  searchBarContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderTopWidth: 0,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  searchBarInputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  offlineBanner: {
    backgroundColor: "#FF5252",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  offlineText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default React.memo(LibraryScreen);