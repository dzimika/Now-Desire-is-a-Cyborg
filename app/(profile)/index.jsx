import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { collection, query, orderBy, getDocs, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { router, useNavigation } from 'expo-router';
import { wordsStore } from '../../store';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';

const ProfilePage = () => {
  //const clickedWord = wordsStore.useState((s) => s.clickedWord);
  const [textInputs, setTextInputs] = useState([]);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  const [associatedWords, setAssociatedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [data02, setData02] = useState([]);
  const [random, setRandom] = useState(null);
  const [embeddings02, setEmbeddings] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => { //finds logged in user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        loadTextInputs(user.uid);
        console.log('user is here hey');
      } else {
        setUser(null);
        setTextInputs([]);
        console.log('theres no suer');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadTextInputs = async (userId) => { //either fetches logged in user's texts or of another random user
    try {
      // Use userId if provided, otherwise use the logged-in user's ID
      const actualUserId = userId || (user && user.uid);
  
      if (!actualUserId) {
        // Handle the case where userId is not provided and there is no logged-in user
        return;
      }
  
      const userCollectionRef = collection(db, 'allTexts');
      const q = query(userCollectionRef, where("userid", "==", actualUserId));
  
      const querySnapshot = await getDocs(q);
      const textInputData = [];
  
      querySnapshot.forEach((doc) => {
        textInputData.push({
          id: doc.id,
          text: doc.data().text,
          timestamp: doc.data().timestamp.toDate(),
        });
      });
  
      setTextInputs(textInputData);
    } catch (error) {
      console.error('Error loading text inputs:', error);
    }
  };

  useEffect(() => { //fetches embeddings file with 50k words
    const fetchEmbeddingsFile = async () => {
      try {
        const response = await axios.get(
          'https://raw.githubusercontent.com/dzimika/MasterProject/main/50kwordsfinal02.json'
        );
        setEmbeddings(response.data);
      } catch (error) {
        console.error('Error fetching embeddings file:', error);
      }
    };

    fetchEmbeddingsFile();
  }, []);

  const handleLikePress = async (textId) => { //stores data into firestore that tells it which user liked which post
    try {
      const textRef = doc(db, 'allTexts', textId);
      const textDoc = await getDoc(textRef);
  
      if (textDoc.exists()) {
        const likedBy = textDoc.data().likedBy || [];
        const userId = user.uid;
  
        if (!likedBy.includes(userId)) {
          await updateDoc(textRef, {
            likedBy: [...likedBy, userId],
          });
  
          console.log('Text liked!');
        } else {
          console.log('Text already liked by the user.');
        }
      }
    } catch (error) {
      console.error('Error liking text:', error);
    }
  };

  const fetchEmbeddings = async (word) => {
    setLoading(true);
    try {
      if (embeddings02) {
        console.log('Available words:', Object.keys(embeddings02));
        console.log ('This is it:', word);

        if (embeddings02[word]) {
          console.log(`Embeddings for '${word}':`, embeddings02[word]);

          // finds similar words
          const similarWords = Object.keys(embeddings02).map((otherWord) => ({
            word: otherWord,
            similarity: cosineSimilarity(embeddings02[word], embeddings02[otherWord]),
          }));

          // sorts similar words by similarity
          similarWords.sort((a, b) => b.similarity - a.similarity);

          // gets the top 5 similar words
          const top5Words = similarWords.slice(0, 5).map((item) => item.word);

          // updates the associated words state
          setAssociatedWords(top5Words);
          console.log ('This is TOP 5:', top5Words);
          retrieveData(top5Words);
        } else {
          console.log(`Word '${word}' not found in the embeddings.`);
          setAssociatedWords([]);
        }
      }
    } catch (error) {
      console.error('Error fetching embeddings:', error);
      setAssociatedWords([]);
    }

    setLoading(false);
  };

  // function to calculate cosine similarity between two vectors
  const cosineSimilarity = (a, b) => {
    const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const retrieveData = async (top5Words) => { // retrieves all the texts that contain top 5 words
    try {
      console.log('This is this much:', top5Words);
      if (top5Words.length === 0) {
        return;
      }
      const citiesRef = collection(db, 'allTexts');
      let retrievedData = [];
      console.log('this is EXECUTING');
  
      for (const word of top5Words) {
        const q = query(citiesRef, where('words', 'array-contains', word));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          retrievedData.push(doc.data());
        });
      }
  
      // Filter out the currently logged-in user's profile
      const filteredData = retrievedData.filter((profile) => profile.userid !== currentUserId);
  
      if (filteredData.length === 0) {
        // Display an alert or handle the case where no other profiles have this word
        console.log('No other profiles have this word');
        return;
      }
  
      setData(filteredData);
  
      const randomIndex = Math.floor(Math.random() * filteredData.length);
      const randomUserId = filteredData[randomIndex].userid;   // selects one random user's profile out of all retrieved text entries
  
      console.log('this is the data here:', filteredData[randomIndex].userid);
      setRandom(randomUserId);
      setCurrentUserId(randomUserId);
      loadTextInputs(randomUserId);
    } catch (error) {
      console.error('Error retrieving data:', error);
    }
  };


  const handleWordClick = (word) => { //when the player clicks the word it searches for associated words for the clicked word
    console.log("the words are clicking");
    fetchEmbeddings(word);
  };

  const renderTextWithClickableWords = (text) => {
    const words = text.split(' ');
  
    return (
      <View style={styles.wordContainer}>
        {words.map((word, index) => {
          // Check if the word is in the embeddings
          const isWordInEmbeddings = embeddings02 && embeddings02[word];
  
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleWordClick(word)}
              style={isWordInEmbeddings ? styles.wordInEmbeddings : styles.word}
            >
              <Text style={isWordInEmbeddings ? styles.wordInEmbeddings : styles.word}>
                {word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Page</Text>
      <FlatList
        data={textInputs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.textInputContainer}>
            {renderTextWithClickableWords(item.text)}
            <Text style={styles.timestamp}>{item.timestamp.toISOString()}</Text>
            <TouchableOpacity onPress={() => handleLikePress(item.id)}>
              <AntDesign name="heart" size={12} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
      {/* Separate container for the footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("(tabs)", { screen: "index" })}>
          <AntDesign name="left" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInputContainer: {
    marginBottom: 16,
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    fontSize: 16,
    marginBottom: 8,
    marginRight: 4,
    color: 'gray'
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0, // Set right to 0 to stretch till the end
    left: 0, // Set left to 0 to take full width
    height: 60, // Adjust the height of the footer container
    justifyContent: 'center',
    paddingHorizontal: 20, // Adjust the horizontal padding as needed
  },
  footerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 10,
  },
  wordInEmbeddings: {
    fontSize: 16,
    marginBottom: 8,
    marginRight: 4,
    color: 'fuchsia', // Change the color or apply any other styles
    fontWeight: 'bold', // Add any other styles as needed
  },
});

export default ProfilePage;
