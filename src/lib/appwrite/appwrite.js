import { Client, Databases, Query } from 'appwrite';

import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_COLLECTION_ID,
  APPWRITE_IMAGES_COLLECTION_ID,
} from '@env';

const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const databases = new Databases(client);




// Function to search for Bangla vocabulary
export const searchbanglaVocabulary = async (searchTerm) => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      [
        Query.search('bangla', searchTerm)
      ]
    );
    const searchResults = response.documents;
    return searchResults;
  } catch (error) {
    console.error('Error searching bangla vocabulary:', error);
    throw error;
  }
};
// Function to search for Korean vocabulary
export const searchkoreanVocabulary = async (searchTerm) => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      [
        Query.search('korean', searchTerm)
      ]
    );
    const searchResults = response.documents;
    return searchResults;
  } catch (error) {
    console.error('Error searching korean vocabulary:', error);
    throw error;
  }
};
export const getSuggestions = async (input, language) => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      [
        Query.search(language.toLowerCase(), input)
      ],
      7 // Limit to top 5 suggestions
    );

    const suggestions = response.documents;
    return suggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
};
// Function to fetch all vocabulary from the database
export const fetchAllVocabulary = async (lastId = null) => {
  try {
    const queries = [Query.limit(25)];
    if (lastId) {
      queries.push(Query.cursorAfter(lastId));
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      queries
    );
    return response;
  } catch (error) {
    console.error('Error fetching all vocabulary:', error);
    throw error;
  }
};


export const getAllImages = async () => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_IMAGES_COLLECTION_ID
    );
    console.log('Appwrite Response:', response); // Log the full response
    const imageUrls = response.documents.map(doc => doc.images_url); // Changed to `images_url`
    console.log('Image URLs:', imageUrls); // Log the image URLs
    return imageUrls;
  } catch (error) {
    console.error('Error fetching images from Appwrite:', error);
    throw error;
  }
};

