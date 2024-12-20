import React, { useMemo } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { Entypo, FontAwesome5, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { FavoritesProvider } from './src/lib/Context/FavoritesContext';
import HomeScreen from './src/Screens/HomeScreen';
import LibraryScreen from './src/Screens/LibraryScreen';
import GrammerScreen from './src/Screens/GrammerScreen';
import FavouriteScreen from './src/Screens/FavouriteScreen';
import { StatusBar } from 'expo-status-bar';

const Tab = createMaterialTopTabNavigator();

const App = () => {
  const tabBarIconSize = 24;

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: '#101010',
      tabBarInactiveTintColor: '#101010',
      tabBarIndicatorStyle: { backgroundColor: '#101010' },
      tabBarLabelStyle: {
        fontSize: 14, // Adjust font size for better fit
        textTransform: 'none', // Prevent capitalization to save space
      },
      tabBarStyle: { backgroundColor: '#fff' },
      showIcon: true,
    }),
    []
  );


  const icons = useMemo(() => ({
    Home: (color) => <Entypo name="home" size={tabBarIconSize} color={color} />,
    Library: (color) => <MaterialIcons name="my-library-books" size={tabBarIconSize} color={color} />,
    Grammar: (color) => <FontAwesome5 name="book-open" size={tabBarIconSize} color={color} />,
    Favourite: (color) => <AntDesign name="heart" size={tabBarIconSize} color={color} />,
  }), []);

  return (
    <FavoritesProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen
              name="Home"
              component={HomeScreen} // Removed React.lazy
              options={{
                tabBarIcon: ({ color }) => icons.Home(color),
                tabBarLabel: 'Home',
              }}
            />
            <Tab.Screen
              name="Library"
              component={LibraryScreen} // Removed React.lazy
              options={{
                tabBarIcon: ({ color }) => icons.Library(color),
                tabBarLabel: 'Library',
              }}
            />
            <Tab.Screen
              name="Grammar"
              component={GrammerScreen} // Removed React.lazy
              options={{
                tabBarIcon: ({ color }) => icons.Grammar(color),
                tabBarLabel: 'Material',
              }}
            />
            <Tab.Screen
              name="Favourite"
              component={FavouriteScreen} // Removed React.lazy
              options={{
                tabBarIcon: ({ color }) => icons.Favourite(color),
                tabBarLabel: 'Favourite',
              }}
            />
          </Tab.Navigator>
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
