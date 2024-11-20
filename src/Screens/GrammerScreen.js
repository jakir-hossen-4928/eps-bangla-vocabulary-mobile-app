import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { getAllImages } from '../lib/appwrite/appwrite';
import ImageViewing from 'react-native-image-viewing';

const windowWidth = Dimensions.get('window').width;

const grammarImages = [
  "https://i.ibb.co.com/QQrBPk7/grammer-1.jpg",
  "https://i.ibb.co.com/KVdjPXV/grammer-2.jpg",
  "https://i.ibb.co.com/9444tz1/grammer-3.jpg",
  "https://i.ibb.co.com/5FT4fnh/grammer-4.jpg",
  "https://i.ibb.co.com/j3dP07D/grammer-5.jpg",
  "https://i.ibb.co.com/Tt95kkv/grammer-6.jpg",
];

const categorizeImages = (urls) => {
  const categories = {
    Grammar: [],
    Leasing: [],
    Reading: [],
  };

  categories.Grammar = grammarImages;

  urls.forEach((url) => {
    if (url.toLowerCase().includes('leasing')) {
      categories.Leasing.push(url);
    } else if (url.toLowerCase().includes('reading')) {
      categories.Reading.push(url);
    }
  });

  return categories;
};

const GrammarScreen = () => {
  const [categories, setCategories] = useState({ Grammar: [], Leasing: [], Reading: [] });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryVisible, setGalleryVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setImageLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const urls = await getAllImages();
        const categorized = categorizeImages(urls);
        setCategories(categorized);
      } catch (error) {
        console.error('Error fetching images:', error);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleImagePress = (index) => {
    setImageLoading(true);
    setSelectedImageIndex(index);
    setGalleryVisible(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.folderContainer}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={styles.folderTitle}>{item}</Text>
      {categories[item][0] && (
        <Image
          source={{ uri: categories[item][0] }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      )}
    </TouchableOpacity>
  );

  const renderImages = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => handleImagePress(index)}
    >
      <Image
        source={{ uri: item }}
        style={styles.image}
        contentFit="cover"
        onLoad={handleImageLoad} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load images. Please try again.</Text>
          <TouchableOpacity onPress={() => setIsLoading(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : selectedCategory === null ? (
        <FlatList
          data={Object.keys(categories)}
          keyExtractor={(item) => item}
          numColumns={2}
          renderItem={renderCategory}
          contentContainerStyle={styles.flatList}
        />
      ) : (
        <View style={styles.imageContainer}>
          <Text style={styles.categoryTitle}>{selectedCategory}</Text>
          <FlatList
            data={categories[selectedCategory]}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={2}
            renderItem={renderImages}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedCategory && (
        <Modal visible={isGalleryVisible} transparent={true}>
          <View style={styles.overlay}>
            {isImageLoading && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Content loading, please wait...</Text>
              </View>
            )}
            <ImageViewing
              images={categories[selectedCategory].map((uri) => ({ uri }))}
              imageIndex={selectedImageIndex}
              visible={isGalleryVisible}
              onRequestClose={() => setGalleryVisible(false)}
              swipeToCloseEnabled
              onImageLoad={handleImageLoad}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    marginBottom: 10,
  },
  retryText: {
    color: '#007AFF',
    fontSize: 16,
  },
  flatList: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  folderContainer: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fefefe',
  },
  folderTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 5,
    color: '#000',
  },
  thumbnail: {
    width: windowWidth * 0.4,
    height: 150,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  imageContainer: {
    flex: 1,
    padding: 10,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#000',
  },
  image: {
    width: windowWidth / 2 - 20,
    height: 150,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
});

export default GrammarScreen;
