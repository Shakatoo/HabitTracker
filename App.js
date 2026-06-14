import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import { load, Keys } from './src/utils/storage';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TodayScreen from './src/screens/TodayScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PURPLE = '#6C47FF';

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="☀️" focused={focused} /> }}
      />
      <Tab.Screen
        name="Challenge"
        component={ChallengeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loaded } = useApp();
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    if (!loaded) return;
    load(Keys.ONBOARDED).then(val => setOnboarded(!!val));
  }, [loaded]);

  if (!loaded || onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : null}
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
