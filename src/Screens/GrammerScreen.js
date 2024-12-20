import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  StatusBar,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { getAllImages } from '../lib/appwrite/appwrite';
import ImageViewing from 'react-native-image-viewing';

const windowWidth = Dimensions.get('window').width;
const ITEM_WIDTH = windowWidth / 2 - 24;

const grammarImages = [
  "https://i.ibb.co.com/QQrBPk7/grammer-1.jpg",
  "https://i.ibb.co.com/KVdjPXV/grammer-2.jpg",
  "https://i.ibb.co.com/9444tz1/grammer-3.jpg",
  "https://i.ibb.co.com/5FT4fnh/grammer-4.jpg",
  "https://i.ibb.co.com/j3dP07D/grammer-5.jpg",
  "https://i.ibb.co.com/Tt95kkv/grammer-6.jpg",
];

// Memoized Category Folder Component
const CategoryFolder = memo(({ title, thumbnail, onPress }) => (
  <TouchableOpacity
    style={styles.folderContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.folderContent}>
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      )}
      <View style={styles.folderOverlay}>
        <Text style={styles.folderTitle}>{title}</Text>
        <Text style={styles.folderSubtitle}>Tap to view</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// Memoized Image Item Component
const ImageItem = memo(({ uri, onPress, index }) => (
  <TouchableOpacity
    style={styles.imageContainer}
    onPress={() => onPress(index)}
    activeOpacity={0.8}
  >
    <Image
      source={{ uri }}
      style={styles.image}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={300}
    />
  </TouchableOpacity>
));

const categorizeImages = (urls) => ({
  Grammar: grammarImages,
  Leasing: urls.filter(url => url.toLowerCase().includes('leasing')),
  Reading: urls.filter(url => url.toLowerCase().includes('reading')),
});

const GrammarScreen = () => {
  const [categories, setCategories] = useState({ Grammar: [], Leasing: [], Reading: [] });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryVisible, setGalleryVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const urls = await getAllImages();
      setCategories(categorizeImages(urls));
    } catch (error) {
      console.error('Error fetching images:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchImages();
  }, [fetchImages]);

  const handleImagePress = useCallback((index) => {
    setSelectedImageIndex(index);
    setGalleryVisible(true);
  }, []);

  const renderCategory = useCallback(({ item: categoryName }) => (
    <CategoryFolder
      title={categoryName}
      thumbnail={categories[categoryName][0]}
      onPress={() => setSelectedCategory(categoryName)}
    />
  ), [categories]);

  const renderImage = useCallback(({ item, index }) => (
    <ImageItem
      uri={item}
      index={index}
      onPress={handleImagePress}
    />
  ), [handleImagePress]);

  const HeaderBar = useCallback(({ title, onBack }) => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  ), []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load content</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchImages}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {selectedCategory ? (
        <View style={styles.categoryView}>
          <HeaderBar
            title={selectedCategory}
            onBack={() => setSelectedCategory(null)}
          />
          <FlatList
            data={categories[selectedCategory]}
            renderItem={renderImage}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.imageGrid}
            removeClippedSubviews={true}
            maxToRenderPerBatch={6}
            windowSize={5}
            initialNumToRender={6}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#007AFF']}
              />
            }
          />
        </View>
      ) : (
        <View style={styles.categoriesView}>
          <Text style={styles.mainTitle}>Learning Materials</Text>
          <FlatList
            data={Object.keys(categories)}
            renderItem={renderCategory}
            keyExtractor={item => item}
            numColumns={2}
            contentContainerStyle={styles.categoriesGrid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#007AFF']}
              />
            }
          />
        </View>
      )}

      <ImageViewing
        images={selectedCategory ? categories[selectedCategory].map(uri => ({ uri })) : []}
        imageIndex={selectedImageIndex}
        visible={isGalleryVisible}
        onRequestClose={() => setGalleryVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        presentationStyle="overFullScreen"
        FooterComponent={({ imageIndex }) => (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {imageIndex + 1} / {categories[selectedCategory]?.length}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  categoriesView: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 16,
    textAlign: 'center',
  },
  categoriesGrid: {
    padding: 12,
  },
  folderContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  folderContent: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 16,
  },
  folderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  folderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  folderSubtitle: {
    fontSize: 14,
    color: '#ddd',
    textAlign: 'center',
    marginTop: 4,
  },
  folderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  categoryView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  imageGrid: {
    padding: 8,
    paddingBottom: 20,
  },
  imageContainer: {
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GrammarScreen;