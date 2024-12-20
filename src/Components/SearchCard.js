import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Keyboard,
  Animated,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import {
  searchbanglaVocabulary,
  searchkoreanVocabulary,
  getSuggestions,
} from "../lib/appwrite/appwrite";

const googleTranslateUrl = process.env.GOGGLETRASLATE;

const detectLanguage = (text) => {
  const banglaRegex = /[\u0980-\u09FF]/;
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;

  if (banglaRegex.test(text)) {
    return { sourceLang: "bn", targetLang: "ko" };
  } else if (koreanRegex.test(text)) {
    return { sourceLang: "ko", targetLang: "bn" };
  } else {
    throw new Error("Please input text in Bangla or Korean");
  }
};

const fetchGoogleTranslate = async (text) => {
  const { sourceLang, targetLang } = detectLanguage(text);

  const data = new URLSearchParams({
    source_lang: sourceLang,
    target_lang: targetLang,
    text: text,
  });

  const response = await fetch(googleTranslateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data.toString(),
  });

  const result = await response.json();

  if (result.status === 'success') {
    return result.translatedText;
  } else {
    throw new Error(result.message);
  }
};

const SearchCard = ({ onSearch, onClear, selectedLanguage }) => {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionSelected, setIsSuggestionSelected] = useState(false);
  const [suggestionsAnimation] = useState(new Animated.Value(0));

  // TextInput reference
  const inputRef = useRef(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (input) => {
    if (input.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const suggestionResults = await getSuggestions(
        input,
        selectedLanguage.toLowerCase()
      );

      const filteredSuggestions = suggestionResults
        .filter((suggestion) =>
          suggestion[selectedLanguage.toLowerCase()]
            .toLowerCase()
            .startsWith(input.toLowerCase())
        )
        .sort((a, b) => {
          const lengthDiff =
            a[selectedLanguage.toLowerCase()].length -
            b[selectedLanguage.toLowerCase()].length;
          return lengthDiff !== 0 ? lengthDiff : a.frequency - b.frequency;
        })
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (!isSuggestionSelected) {
      const debounceTimeout = setTimeout(() => {
        fetchSuggestions(inputValue);
      }, 300);
      return () => clearTimeout(debounceTimeout);
    } else {
      setIsSuggestionSelected(false);
    }
  }, [inputValue]);

  useEffect(() => {
    Animated.timing(suggestionsAnimation, {
      toValue: showSuggestions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showSuggestions]);

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      setInputValue(clipboardContent);
    } catch (error) {
      Alert.alert("Error", "Failed to paste from clipboard");
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    onClear();
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleSearch = async (input) => {

    if (!input.trim()) return;

    setLoading(true);
    if (inputRef.current) inputRef.current.blur();

    try {
      let result;
      if (selectedLanguage === "Bangla") {
        result = await searchbanglaVocabulary(input);
      } else {
        result = await searchkoreanVocabulary(input);
      }

      if (result.length === 0) {
        try {
          const translatedText = await fetchGoogleTranslate(input);
          const { sourceLang ,targetLang} = detectLanguage(input);
          const searchData = {
            bangla: sourceLang === "bn" ? input : translatedText,
            korean: sourceLang === "ko" ? input : translatedText,
          };
          onSearch([searchData]);
        } catch (error) {
          Alert.alert("Translation Error", error.message);
        }
      } else {
        onSearch(result);
      }

    } catch (error) {
      if (error.message === "Network request failed") {
        Alert.alert(
          "No Internet Connection",
          "Please check your internet connection and try again."
        );
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setIsSuggestionSelected(true);
    setInputValue(suggestion[selectedLanguage.toLowerCase()]);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef} // Attach ref to the TextInput
              style={styles.input}
              placeholder={`Enter ${selectedLanguage} word`}
              value={inputValue}
              onChangeText={setInputValue}
              placeholderTextColor="#9CA3AF"
              multiline={false}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(inputValue)}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handlePasteFromClipboard}
                style={styles.iconButton}
              >
                <FontAwesome5 name="paste" size={20} color="#6B7280" />
              </TouchableOpacity>
              {inputValue.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearInput}
                  style={styles.iconButton}
                >
                  <MaterialIcons name="clear" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Animated.View
            style={[
              styles.suggestionsContainer,
              {
                opacity: suggestionsAnimation,
                transform: [
                  {
                    translateY: suggestionsAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {showSuggestions &&
              suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 && styles.lastSuggestion,
                  ]}
                  onPress={() => handleSuggestionClick(suggestion)}
                >
                  <Text style={styles.suggestionText}>
                    {suggestion[selectedLanguage.toLowerCase()]}
                  </Text>
                </TouchableOpacity>
              ))}
          </Animated.View>
        </View>

        {!showSuggestions && (
          <TouchableOpacity
            style={[
              styles.searchButton,
              (!inputValue || loading) && styles.searchButtonDisabled,
            ]}
            onPress={() => handleSearch(inputValue)}
            disabled={!inputValue || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchContainer: {
    position: "relative",
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 48,
  },
  actionButtons: {
    flexDirection: "row",
    paddingRight: 8,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 8,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  lastSuggestion: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 16,
    color: "#374151",
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: "#93C5FD",
    shadowOpacity: 0.1,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SearchCard;
