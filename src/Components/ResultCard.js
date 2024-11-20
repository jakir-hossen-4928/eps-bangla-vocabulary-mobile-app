import React, { useState, useContext, useCallback, memo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Share, Alert, RefreshControl } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { Feather, FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FavoritesContext } from '../lib/Context/FavoritesContext';

const ResultCard = ({ searchResult, refreshing, onRefresh }) => {
  const { favorites = [], toggleFavorite } = useContext(FavoritesContext);

  // State to manage copied text message for each item
  const [copiedText, setCopiedText] = useState({});
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const copyToClipboard = useCallback((text, index) => {
    Clipboard.setString(text);
    setCopiedText(prev => ({ ...prev, [index]: 'Copied to clipboard!' }));
    setTimeout(() => {
      setCopiedText(prev => ({ ...prev, [index]: '' }));
    }, 2000);
  }, []);

  const shareContent = useCallback(async (text) => {
    try {
      const result = await Share.share({ message: text });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('Shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Error sharing content');
      console.error('Error sharing:', error.message);
    }
  }, []);

  const toggleFavoriteHandler = useCallback((item) => {
    toggleFavorite(item);
  }, [toggleFavorite]);

  const speakText = useCallback((text, index) => {
    if (speakingIndex === index) {
      Speech.stop();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      Speech.speak(text, {
        language: 'ko-KR',
        voice: 'ko-kr-x-kfn-local',
        pitch: 1.1,
        rate: 0.95,
        onDone: () => setSpeakingIndex(null),
        onStopped: () => setSpeakingIndex(null),
        onError: (error) => {
          console.error('Speech error:', error);
          setSpeakingIndex(null);
        },
      });
    }
  }, [speakingIndex]);

  const renderItem = useCallback(({ item, index }) => {
    const textToCopy = `Bangla: ${item.bangla}\nKorean: ${item.korean}`;
    const isFavorite = favorites.some(fav => fav.bangla === item.bangla && fav.korean === item.korean);

    return (
      <SafeAreaView>
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{textToCopy}</Text>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => copyToClipboard(textToCopy, index)}>
              <Feather name="copy" size={24} color="white" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavoriteHandler(item)}>
              {isFavorite ? (
                <MaterialIcons name="done-outline" size={24} color="white" style={styles.favoriteCheckIcon} />
              ) : (
                <MaterialCommunityIcons name="heart-plus" size={24} color="white" style={styles.favoriteIcon} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareContent(textToCopy)}>
              <FontAwesome name="share-square-o" size={24} color="white" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => speakText(item.korean, index)}>
              {speakingIndex === index ? (
                <FontAwesome name="volume-up" size={24} color="white" style={styles.icon} />
              ) : (
                <Feather name="volume-1" size={24} color="white" style={styles.icon} />
              )}
            </TouchableOpacity>
          </View>
          {copiedText[index] ? (
            <Text style={styles.copiedText}>{copiedText[index]}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }, [favorites, copiedText, speakingIndex, copyToClipboard, toggleFavoriteHandler, shareContent, speakText]);

  return (
    searchResult.length > 0 && (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
                colors={['#101010']}
                tintColor="#101010"
              />
            }
            ListEmptyComponent={<Text style={styles.emptyText}>No results found</Text>}
          />
        </View>
      </SafeAreaView>
    )
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  icon: {
    padding: 10,
    backgroundColor: '#101010',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 16,
  },
  favoriteIcon: {
    padding: 10,
    backgroundColor: '#101010',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    color: '#ffffff',
  },
  favoriteCheckIcon: {
    padding: 10,
    backgroundColor: '#101010',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    color: '#ffffff',
  },
  copiedText: {
    textAlign: 'center',
    marginTop: 5,
    color: '#101010',
    fontSize: 14,
  },
});

export default memo(ResultCard);
