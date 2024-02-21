import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig'

const LikedTextsPage = () => { //saved posts_fetches liked posts from database and displays it

  const [likedTexts, setLikedTexts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => { //finds the logged in user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        loadLikedTexts(user.uid);
        console.log('User is logged in');
      } else {
        setUser(null);
        setLikedTexts([]);
        console.log('No user is logged in');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadLikedTexts = async (userId) => { //quiery and fetch data from Firestore
    try {
      const actualUserId = userId || (user && user.uid);

      if (!actualUserId) {
        return;
      }

      // created a query to get texts where the likedBy array contains the user's ID
      const likedTextsRef = collection(db, 'allTexts');
      const likedTextsQuery = query(likedTextsRef, where('likedBy', 'array-contains', actualUserId));

      const querySnapshot = await getDocs(likedTextsQuery);
      const likedTextsData = [];

      querySnapshot.forEach((doc) => {
        likedTextsData.push({
          id: doc.id,
          text: doc.data().text,
          timestamp: doc.data().timestamp.toDate(),
        });
      });

      setLikedTexts(likedTextsData);
    } catch (error) {
      console.error('Error loading liked texts:', error);
    }
  };

  const renderLikedText = (text) => { //renders each post separately with timestamp
    return (
      <View style={styles.textInputContainer}>
        <Text>{text.text}</Text>
        <Text style={styles.timestamp}>{text.timestamp.toISOString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>wondering who said this</Text>
      <FlatList
        data={likedTexts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View>{renderLikedText(item)}</View>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInputContainer: {
    marginBottom: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
});

export default LikedTextsPage;