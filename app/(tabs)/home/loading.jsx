import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LoadingScreen() {
  const lines = [
    'sex sells...',
    'sex sells...',
    'who is selling sex?',
    'who?',
    'is it you?',
    'is it?',
    "that's shameful.",
  ];

  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex(currentLineIndex + 1);
      }
    }, 1500); // Adjust the timing between each line as needed

    return () => clearInterval(timer);
  }, [currentLineIndex]);

  const renderLines = () => {
    return lines.map((line, index) => {
      const opacity = currentLineIndex - index >= 0 ? 1 - 0.5 * (currentLineIndex - index) : 0;
      return (
        <Text key={index} style={[styles.text, { opacity }]}>
          {line}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      {renderLines()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
});
