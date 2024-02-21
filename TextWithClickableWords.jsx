import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TextWithClickableWords = ({ text, onWordClick }) => {
  const words = text.split(' ');

  const handleWordClick = (word) => {
    if (onWordClick) {
      onWordClick(word);
    }
  };

  return (
    <View style={styles.wordContainer}>
      {words.map((word, index) => (
        <TouchableOpacity key={index} onPress={() => handleWordClick(word)}>
          <Text style={styles.word}>{word}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    fontSize: 16,
    marginBottom: 8,
    marginRight: 4,
  },
});

export default TextWithClickableWords;