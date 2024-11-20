import React, { View, Image, StyleSheet } from 'react-native';

const Loading = () => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://icons8.com/preloaders/preloaders/1488/Iphone-spinner-2.gif' }}
        style={styles.image}
        alt="Loading"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Occupy the entire screen
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
    backgroundColor: '#fff', // White background for better visibility
  },
  image: {
    width: 100, // Adjust width as needed
    height: 100, // Adjust height as needed
  },
});

export default Loading;
