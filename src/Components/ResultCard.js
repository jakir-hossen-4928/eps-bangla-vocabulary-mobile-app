import React, { useState, useContext, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  RefreshControl,
  FlatList,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Speech from "expo-speech";
import { Feather, FontAwesome, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { FavoritesContext } from "../lib/Context/FavoritesContext";

const ActionButton = memo(({ onPress, icon: Icon, name, color, size = 24 }) => (
  <TouchableOpacity onPress={onPress} style={styles.actionButton}>
    <Icon name={name} size={size} color={color} />
  </TouchableOpacity>
));

const TranslationItem = memo(({
  item,
  index,
  isFavorite,
  copiedText,
  speakingIndex,
  onCopy,
  onToggleFavorite,
  onShare,
  onSpeak,
}) => (
  <View style={styles.itemCard}>
    <View style={styles.translationContent}>
      <Text style={styles.languageLabel}>Bangla</Text>
      <Text style={styles.translationText}>{item.bangla}</Text>
      <Text style={styles.languageLabel}>Korean</Text>
      <Text style={styles.translationText}>{item.korean}</Text>
    </View>

    <View style={styles.actionContainer}>
      <ActionButton
        onPress={() => onCopy(item.bangla, item.korean, index)}
        icon={Feather}
        name="copy"
        color="#757575"
      />
      <ActionButton
        onPress={() => onToggleFavorite(item)}
        icon={MaterialIcons}
        name={isFavorite ? "favorite" : "favorite-border"}
        color={isFavorite ? "#FF4081" : "#757575"}
      />
      <ActionButton
        onPress={() => onShare(item.bangla, item.korean)}
        icon={FontAwesome}
        name="share-square-o"
        color="#757575"
      />
      <ActionButton
        onPress={() => onSpeak(item.korean, index)}
        icon={FontAwesome}
        name={speakingIndex === index ? "volume-up" : "volume-down"}
        color={speakingIndex === index ? "#2196F3" : "#757575"}
      />
    </View>

    {copiedText[index] && (
      <Text style={styles.copiedMessage}>{copiedText[index]}</Text>
    )}
  </View>
));

const ResultCard = ({ searchResult = [], refreshing = false, onRefresh = () => {} }) => {
  const { favorites = [], toggleFavorite } = useContext(FavoritesContext);
  const [copiedText, setCopiedText] = useState({});
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const copyToClipboard = useCallback(async (bangla, korean, index) => {
    const text = `Bangla: ${bangla}\nKorean: ${korean}`;
    await Clipboard.setStringAsync(text);
    setCopiedText((prev) => ({ ...prev, [index]: "Copied to clipboard!" }));
    setTimeout(() => {
      setCopiedText((prev) => ({ ...prev, [index]: "" }));
    }, 2000);
  }, []);

  const shareContent = useCallback(async (bangla, korean) => {
    try {
      const text = `Bangla: ${bangla}\nKorean: ${korean}`;
      await Share.share({ message: text });
    } catch (error) {
      Alert.alert("Error", "Unable to share content");
    }
  }, []);

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
      onStopped: () => setSpeakingIndex(null),
      onError: () => {
        setSpeakingIndex(null);
        Alert.alert("Error", "Unable to play audio");
      },
    });
  }, [speakingIndex]);

  const renderItem = useCallback(
    ({ item, index }) => {
      const isFavorite = favorites.some(
        (fav) => fav.bangla === item.bangla && fav.korean === item.korean
      );

      return (
        <TranslationItem
          item={item}
          index={index}
          isFavorite={isFavorite}
          copiedText={copiedText}
          speakingIndex={speakingIndex}
          onCopy={copyToClipboard}
          onToggleFavorite={toggleFavorite}
          onShare={shareContent}
          onSpeak={speakText}
        />
      );
    },
    [favorites, copiedText, speakingIndex, copyToClipboard, toggleFavorite, shareContent, speakText]
  );

  if (!searchResult.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {/* To get started, type a word or phrase in the search bar */}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={searchResult}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  translationContent: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  translationText: {
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 12,
  },
  copiedMessage: {
    textAlign: "center",
    marginTop: 8,
    color: "#059669",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ResultCard;
