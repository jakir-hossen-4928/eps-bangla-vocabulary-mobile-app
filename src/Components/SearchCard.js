import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import {
  searchbanglaVocabulary,
  searchkoreanVocabulary,
  getSuggestions,
} from "../lib/appwrite/appwrite";

const googleTranslateUrl = process.env.GOGGLETRASLATE;

const detectLanguage = (text) => {
  const banglaRegex = /[\u0980-\u09FF]/; // Unicode range for Bangla
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/; // Unicode range for Korean

  if (banglaRegex.test(text)) {
    return { sourceLang: 'bn', targetLang: 'ko' }; // Bangla to Korean
  } else if (koreanRegex.test(text)) {
    return { sourceLang: 'ko', targetLang: 'bn' }; // Korean to Bangla
  } else {
    throw new Error('Unsupported language. Please input text in Bangla or Korean.');
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
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionSelected, setIsSuggestionSelected] = useState(false);

  useEffect(() => {
    if (!isSuggestionSelected) {
      fetchSuggestions(inputValue);
    } else {
      setIsSuggestionSelected(false);
    }
  }, [inputValue]);

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

      const filteredSuggestions = suggestionResults.filter((suggestion) =>
        suggestion[selectedLanguage.toLowerCase()].toLowerCase().startsWith(input.toLowerCase())
      );

      filteredSuggestions.sort((a, b) => {
        const suggestionA = a[selectedLanguage.toLowerCase()];
        const suggestionB = b[selectedLanguage.toLowerCase()];

        if (suggestionA.length !== suggestionB.length) {
          return suggestionA.length - suggestionB.length;
        }

        return a.frequency - b.frequency;
      });

      setSuggestions(filteredSuggestions);
      if (filteredSuggestions.length > 0) {
        setSelectedSuggestion(filteredSuggestions[0][selectedLanguage.toLowerCase()]);
        setShowSuggestions(true);
      } else {
        setSelectedSuggestion("");
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedLanguage]);

  const handlePasteFromClipboard = async () => {
    const clipboardContent = await Clipboard.getString();
    setInputValue(clipboardContent);
  };

  const handleClearInput = () => {
    setInputValue("");
    onClear();
    setSuggestions([]);
    setSelectedSuggestion("");
    setShowSuggestions(false);
  };

  const handleSearch = async (input) => {
    setLoading(true);
    try {
      let result;
      if (selectedLanguage === "Bangla") {
        result = await searchbanglaVocabulary(input);
      } else {
        result = await searchkoreanVocabulary(input);
      }

      if (result.length === 0) {
        // If no local results, use Google Translate
        try {
          const translatedText = await fetchGoogleTranslate(input);
          const { sourceLang, targetLang } = detectLanguage(input);
          // Pass both original input and translated text to onSearch
          const searchData = {
            bangla: sourceLang === 'bn' ? input : translatedText,
            korean: sourceLang === 'ko' ? input : translatedText,
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
      } else if (error.message === "Invalid language selected") {
        Alert.alert("Invalid Language", "Please select a valid language.");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const handleInputChange = (text) => {
    setInputValue(text);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === " ") {
      setInputValue((prev) => `${prev}${selectedSuggestion.slice(prev.length)}`);
      setSuggestions([]);
      setShowSuggestions(false);
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
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handlePasteFromClipboard}
            style={styles.iconContainer}
          >
            <FontAwesome5 name="paste" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClearInput}
            style={styles.iconContainer}
          >
            <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Enter word in ${selectedLanguage}...`}
            value={inputValue}
            onChangeText={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholderTextColor="#ccc"
            textAlignVertical="top"
            multiline={true}
          />
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index} 
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionClick(suggestion)}
                >
                  <Text style={styles.suggestionText}>
                    {suggestion[selectedLanguage.toLowerCase()]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {!showSuggestions && (
          <View style={styles.translateButtonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#101010" />
            ) : (
              <TouchableOpacity
                style={styles.translateButton}
                onPress={() => handleSearch(inputValue)}
                disabled={!inputValue}
              >
                <Text style={styles.translateButtonText} >Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconContainer: {
    padding: 10,
    backgroundColor: "#101010",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: "#101010",
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    width: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  suggestionText: {
    fontSize: 18,
  },
  translateButtonContainer: {
    marginTop: 10,
  },
  translateButton: {
    backgroundColor: "#101010",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  translateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SearchCard;
