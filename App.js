import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView, StyleSheet, Text, StatusBar } from 'react-native';
import { Entypo, FontAwesome5, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { FavoritesProvider } from './src/lib/Context/FavoritesContext';
import HomeScreen from './src/Screens/HomeScreen';
import LibraryScreen from './src/Screens/LibraryScreen';
import GrammerScreen from './src/Screens/GrammerScreen';
import FavouriteScreen from './src/Screens/FavouriteScreen';


const Tab = createMaterialTopTabNavigator();

const App = () => {
  const tabBarIconSize = 24;

  return (
    <FavoritesProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <SafeAreaView style={styles.container}>
            {/* <StatusBar barStyle="light-content" backgroundColor="#101010" /> */}
            <Text style={styles.headerText}>Eps-Bangla Vocabulary</Text>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ color }) => {
                  let iconName;
                  let iconSize = tabBarIconSize;

                  if (route.name === 'Home') {
                    iconName = <Entypo name="home" size={iconSize} color={color} />;
                  } else if (route.name === 'Library') {
                    iconName = <MaterialIcons name="my-library-books" size={iconSize} color={color} />;
                  } else if (route.name === 'Grammar') {
                    iconName = <FontAwesome5 name="book-open" size={iconSize} color={color} />;
                  } else if (route.name === 'Favourite') {
                    iconName = <AntDesign name="heart" size={iconSize} color={color} />;
                  }

                  return iconName;
                },
                tabBarLabel: ({ color }) => {
                  let label;

                  if (route.name === 'Home') {
                    label = 'Home';
                  } else if (route.name === 'Library') {
                    label = 'Library';
                  } else if (route.name === 'Grammar') {
                    label = 'Grammar';
                  } else if (route.name === 'Favourite') {
                    label = 'Favourite';
                  }

                  return <Text style={{ color, fontSize: 16 }}>{label}</Text>;
                },
                tabBarShowIcon: true,
                tabBarIndicatorStyle: {
                  backgroundColor: '#101010',
                },
                tabBarStyle: { backgroundColor: '#fff' },
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Library" component={LibraryScreen} />
              <Tab.Screen name="Grammar" component={GrammerScreen} />
              <Tab.Screen name="Favourite" component={FavouriteScreen} />
            </Tab.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </FavoritesProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  headerText: {
    textAlign: 'center',
    fontSize: 24, // Increased size for better readability
    fontWeight: 'bold',
    color: '#101010', // Dark color for readability
    lineHeight: 32, // Improved line height for readability
    textShadowColor: '#d3d3d3', // Light shadow for a subtle effect
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
});

export default App;
