import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { SearchBar } from "react-native-elements";
import { fetchAllVocabulary } from "../lib/appwrite/appwrite";
import NetInfo from "@react-native-community/netinfo";
import { FavoritesContext } from "../lib/Context/FavoritesContext";
import Loading from "../Components/Loading";
import debounce from "lodash/debounce";
import * as Speech from "expo-speech";
import {
  Feather,
  FontAwesome,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

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

  useEffect(() => {
    initializeData();
    checkInternetConnection();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        Alert.alert("No Internet", "Please check your internet connection.");
      }
    });
    return () => unsubscribe();
  }, []);

  const initializeData = useCallback(async () => {
    try {
      const response = await fetchAllVocabulary();
      const vocab = response.documents;
      const uniqueVocab = filterUniqueVocabulary(vocab);
      setVocabulary(uniqueVocab);
      setLastId(response.documents[response.documents.length - 1]?.$id);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing vocabulary:", error);
      setIsLoading(false);
    }
  }, []);

  const checkInternetConnection = useCallback(() => {
    NetInfo.fetch().then((state) => {
      if (!state.isConnected) {
        Alert.alert("No Internet", "Please check your internet connection.");
      }
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  }, [initializeData]);

  const filterUniqueVocabulary = useCallback((vocab) => {
    const uniqueItems = {};
    return vocab.filter((item) => {
      if (!uniqueItems[item.bangla] && !uniqueItems[item.korean]) {
        uniqueItems[item.bangla] = true;
        uniqueItems[item.korean] = true;
        return true;
      }
      return false;
    });
  }, []);

  const handleSearch = useCallback(
    (text) => {
      const lowerCaseInput = text.toLowerCase().trim();
      const exactMatch = vocabulary.filter(
        (doc) =>
          doc.bangla.toLowerCase() === lowerCaseInput ||
          doc.korean.toLowerCase() === lowerCaseInput
      );
      const results = vocabulary.filter(
        (doc) =>
          doc.bangla.toLowerCase().includes(lowerCaseInput) ||
          doc.korean.toLowerCase().includes(lowerCaseInput)
      );
      if (exactMatch.length > 0) {
        setSearchResult(exactMatch);
      } else if (results.length > 0) {
        setSearchResult(results);
      } else {
        setSearchResult([]);
      }
    },
    [vocabulary]
  );

  const debouncedHandleSearch = useCallback(debounce(handleSearch, 300), [
    handleSearch,
  ]);

  const loadMoreVocabulary = useCallback(async () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const response = await fetchAllVocabulary(lastId);
      const moreVocab = response.documents;
      setVocabulary((prevVocab) => [...prevVocab, ...moreVocab]);
      setLastId(response.documents[response.documents.length - 1]?.$id);
    } catch (error) {
      console.error("Error loading more vocabulary:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, lastId]);

  const speakText = useCallback(
    (text, index) => {
      if (speakingIndex === index) {
        Speech.stop();
        setSpeakingIndex(null);
      } else {
        setSpeakingIndex(index);
        Speech.speak(text, {
          language: "ko-KR",
          voice: "ko-kr-x-kfn-local",
          pitch: 1.1,
          rate: 0.95,
          onDone: () => setSpeakingIndex(null),
          onStopped: () => setSpeakingIndex(null),
          onError: (error) => {
            console.error("Speech error:", error);
            setSpeakingIndex(null);
          },
        });
      }
    },
    [speakingIndex]
  );

  const handleToggleFavorite = useCallback(
    (item) => {
      toggleFavorite(item);
    },
    [toggleFavorite]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const isInFavorites = favorites.some(
        (fav) => fav.bangla === item.bangla && fav.korean === item.korean
      );

      const handleToggleFavorite = () => {
        toggleFavorite(item);
      };

      const handleSpeakText = () => {
        speakText(item.korean, index);
      };

      return (
        <TouchableWithoutFeedback onPress={handleSpeakText}>
          <View style={styles.item}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Bangla: {item.bangla}</Text>
              <Text style={styles.title}>Korean: {item.korean}</Text>
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={handleToggleFavorite}>
                {isInFavorites ? (
                  <MaterialIcons
                    name="done-outline"
                    size={24}
                    color="#101010"
                    style={styles.favoriteCheckIcon}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="heart-plus"
                    size={24}
                    color="#101010"
                    style={styles.favoriteIcon}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSpeakText}>
                {speakingIndex === index ? (
                  <FontAwesome
                    name="volume-up"
                    size={24}
                    color="#101010"
                    style={styles.volumeIcon}
                  />
                ) : (
                  <Feather
                    name="volume-1"
                    size={24}
                    color="#101010"
                    style={styles.volumeIcon}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      );
    },
    [favorites, toggleFavorite, speakingIndex, speakText]
  );

  const handleInputChange = useCallback(
    (text) => {
      setInputValue(text);
      if (text.trim().length === 0) {
        setSearchResult([]);
      } else {
        debouncedHandleSearch(text);
      }
    },
    [debouncedHandleSearch]
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <SearchBar
            placeholder="Type here..."
            onChangeText={handleInputChange}
            value={inputValue}
            lightTheme
            round
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            onClear={() => {
              setInputValue("");
              setSearchResult([]);
              Keyboard.dismiss();
            }}
          />
          <FlatList
            data={searchResult.length > 0 ? searchResult : vocabulary}
            renderItem={renderItem}
            keyExtractor={(item) => item.$id}
            onEndReached={loadMoreVocabulary}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isFetchingMore ? (
                <ActivityIndicator size="small" color="#101010" />
              ) : null
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  item: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Ensures icons are vertically centered
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: "#101010",
  },
  searchBarContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  searchBarInputContainer: {
    backgroundColor: "#e0e0e0",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteIcon: {
    marginLeft: 10,
  },
  favoriteCheckIcon: {
    marginLeft: 10,
  },
  volumeIcon: {
    marginLeft: 10,
  },
});

export default LibraryScreen;
