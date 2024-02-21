import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { GameStore } from '../../store';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig'
import gameData from '../../scenes.json'
import { useNavigation } from 'expo-router';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import Loading from '../../components/loading';

const initialVariables = gameData.initialVariables;
const scenarios = gameData.scenarios;
const afterscenarios = gameData.afterscenarios;
const finalscenarios = gameData.finalscenarios;
const enabledScenarios = gameData.enabledScenarios;

export default function App() {
  const navigation = useNavigation();
  const newLocation = GameStore.useState((s) => s.locationIs);
  const initialScenario = enabledScenarios[newLocation][0];
  const [variables, setVariables] = useState(initialVariables);
  const [currentScenario, setCurrentScenario] = useState(initialScenario);
  const [currentScenarioChange, setCurrentScenarioChange] = useState(initialScenario);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentText, setCurrentText] = useState('');
  const [inputText, setInputText] = useState('');
  const [automaticTriggered, setAutomaticTriggered] = useState(false);
  const [currentStage, setCurrentStage] = useState("scenarios");
  const [finalText, setFinalText] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [selectedPickerVariable, setSelectedPickerVariable] = useState(null);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [parameterValues, setParameterValues] = useState(gameData.parametervalues);
  const [variableClicked, setVariableClicked] = useState(false);
  const [associatedWords, setAssociatedWords] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [random, setRandom] = useState(null);
  const [embeddings02, setEmbeddings] = useState(null);
  const [isRenderAvailable, setRenderAvailable] =useState(true);

  useEffect(() => { //fetches 50k embedded words
    console.log("its being fetched constantly");
    setTimeout(() => setLoading(false), 2000);
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

    const displayAlert = (counter) => { //displays random alerts throughout the game
      console.log()
      const minTime = 5000; 
      const maxTime = 90000; 

      // shows the next alert if the counter is less than 3
      if (counter < 3) {
        const randomTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

        // creates a random timeout to show the alert
        setTimeout(() => {
          const alertMessages = ['Alert 1', 'Alert 2', 'Alert 3'];
          const randomAlert = Math.floor(Math.random() * alertMessages.length);
          Alert.alert('Random Alert', alertMessages[randomAlert]);

          // increments the counter and shows the next alert
          displayAlert(counter + 1);
        }, randomTime);
      }
    };
    displayAlert(0);
  }, []);

  const updateText = (stepInfo) => { // every time variables inside the text change the text gets updated real-time
    console.log("updating Text");
    const textKey = `text${variables.isChosen.slice(-1)}`;
    const textChange = stepInfo[textKey];
    if (textChange) {
      const newText = textChange.split(/\${(.*?)}/g).map((part, index) => { // filters out placeholders from json scenario files
        if (index % 2 === 0) {
          return part;
        } else {
          const variableName = part;
          if (Array.isArray(variableName)) { //displays clickable variables in blue
            return variableName.map((varName, i) => {
              if (variables[varName]) {
                return (
                  <Text
                    key={varName}
                    style={[styles.clickableText, { color: 'blue' }]}
                    onPress={() => handleVariableClick(varName)}
                  >
                    {variables[varName]}
                  </Text>
                );
              } else {
                return `{{${varName}}}`; // handles missing variables
              }
            });
          } else if (variables[variableName]) {
            return (
              <Text
                key={variableName}
                style={[styles.clickableText, { color: 'blue' }]}
                onPress={() => handleVariableClick(variableName)}
              >
                {variables[variableName]}
              </Text>
            );
          } else {
            return `{{${variableName}}}`; 
          }
        }
      }).flat(); // flattens the array to handle multiple words/values
  
      setCurrentText(newText);
    }
  };

  const handleVariableClick = (variableName) => {
    console.log("current stage", currentStage);
    console.log("current scenario", currentScenario);
    console.log("current step", currentStep);
    const currentStepInfo = afterscenarios[currentScenario].story[`s${currentStep}`];
      if (currentStepInfo.options === "parameters") {
        console.log("currentstepinfo", currentStepInfo.options);
        setVariableClicked(true);
        // highlights the clicked variable and disables other variables
        const updatedText = currentText.map((part, index) => { //handles game - editing stage 
          if (typeof part === 'object' && part.key && part.props) {
            return (
              <Text key={part.key} style={{ color: 'blue' }}>
                {part.props.children}
              </Text>
            );
          } else {
            return (
              <Text key={index} style={{ color: 'gray' }}>
                {part}
              </Text>
            );
          }
        });
        setCurrentText(updatedText);
      } else if (variableName.startsWith('pckr')) { //editable variables with picker available
      setSelectedPickerVariable(variableName);
      setIsPickerVisible(true);
      } else {
        // handles case where variables are not editable
        console.log(`Variable ${variableName} does not start with 'pckr'`);
        Alert.alert(
          'Alert',
          'Do something for variables not starting with pckr?',
          [
            {
              text: 'Yes',
              onPress: () => {
                console.log('OK Pressed for non-pckr');
              }
            },
            {
              text: 'No',
              onPress: () => console.log('No Pressed')
            }
          ]
        );
      }
  };

  const renderPicker = (variableName) => { // renders picker
    const pickerOptions = scenarios[currentScenario].story[`s${currentStep}`].pckroptions || [];
    const initialPickerValue = variables[variableName];
  
    return (
      <View style={styles.pickerContainer}>
        {isPickerVisible && (
          <Picker
            selectedValue={initialPickerValue}
            onValueChange={(itemValue) => handlePickerChange02(itemValue, variableName)}
            style={styles.picker}
          >
            {pickerOptions.map((option, index) => (
              <Picker.Item label={option} value={option} key={index} />
            ))}
          </Picker>
        )}
      </View>
    );
  };

  const handlePickerChange02 = (selectedOption, variableName) => { // handles picker interaction
    setVariables((prevVariables) => ({
      ...prevVariables,
      [variableName]: selectedOption,
    }));
    const shouldShowButton = true;
    console.log(`Picker option selected: ${selectedOption} for variable ${variableName}`);
    Alert.alert(
      'Alert',
      'Are you sure?',
      [
        {
          text: 'Yes',
          onPress: () => {
            setIsPickerVisible(false);
            setIsButtonVisible(true);
            renderNextButton();
          }
        },
        {
          text: 'No',
          onPress: () => console.log('No Pressed')
        }
      ]
    );
  };

  const renderNextButton = () => {
    if (!isButtonVisible) {
      return null; // If isVisible is false, return null to render nothing
    }
  
    return (
      <TouchableOpacity style={styles.nextButton} onPress={handleNextButtonClick}>
        <Text>Next</Text>
      </TouchableOpacity>
    );
  };

  const handleNextButtonClick = () => {
    console.log('Next button clicked');
    handleNextStep();
    setIsButtonVisible(false);
    // Add any additional logic you want to execute when the button is clicked
  };

  const handleNextStep = () => { // handles transition between steps in one scene dependant on current stage
    if (currentStage === "scenarios") { // when at first level
      console.log("ITS HANDLING IT");
      const nextStep = currentStep + 1;
      const nextStepInfo = scenarios[currentScenario].story[`s${nextStep}`];
      const currentStepInfo = scenarios[currentScenario].story[`s${currentStep}`];
      if (nextStepInfo && currentStepInfo.value !== 'isChosen') {
        setCurrentStep(nextStep);
        updateText(nextStepInfo);
        setAutomaticTriggered(false);
        setVariables(prevVariables => ({
          ...prevVariables,
          isChosen: 'text1'
        }));
      } else if (nextStepInfo) {
        setCurrentStep(nextStep);
        updateText(nextStepInfo);
        setAutomaticTriggered(false);
      }else {
        console.log("game over");
        handleNextScenario();
        //setCurrentText("Game over.");
      }
  } else if (currentStage === "afterscenarios") { //when at second level
      setVariableClicked(false);
      console.log("ITS HANDLING IT 2");
      console.log("current step is:", currentStep);
      const nextStep = currentStep + 1;
      const nextStepInfo = afterscenarios[currentScenario].story[`s${nextStep}`];
      console.log("next step info:", nextStepInfo);
      const currentStepInfo = afterscenarios[currentScenario].story[`s${currentStep}`];
      console.log("current step info is:", currentStepInfo);
      if (nextStepInfo && currentStepInfo.value !== 'isChosen') {
        console.log("is it handling it?");
        setCurrentStep(nextStep);
        updateText(nextStepInfo);
        setVariables(prevVariables => ({
          ...prevVariables,
          isChosen: 'text1'
        }));
      } else if (nextStepInfo) {
        setCurrentStep(nextStep);
        updateText(nextStepInfo);
      }else {
        console.log("game over02");
        handleNextScenario();
        //setCurrentText("Game over.");
      };
  } else {
    console.log ("there was a mistake setting the stage");
  }
  };

  const handleNextScenario = () => { // handles transtition between two scenes
    const enabledScenariosForLocation = enabledScenarios[newLocation];
    const currentIndex = enabledScenariosForLocation.indexOf(currentScenario);
    console.log("currentIndex is", currentIndex);
    console.log("enabled scenarios", enabledScenariosForLocation);
  
    if (currentIndex < enabledScenariosForLocation.length - 1) {
      const nextScenario = enabledScenariosForLocation[currentIndex + 1];
      console.log('Next Scenario:', nextScenario);
      console.log('Next Scenario Steps:', scenarios[nextScenario]?.story);
      const nextStepInNextScenario = scenarios[nextScenario].story[`s1`]; // get the first step in the next scenario
      console.log('First step in next Scenario:', nextStepInNextScenario);
      //setCurrentScenario(nextScenario);
      //setCurrentStep(1); // Set to the first step of the new scenario
  
      if (nextStepInNextScenario) {
        setCurrentScenario(nextScenario);
        setCurrentScenarioChange(nextScenario);
        console.log("We sat new scenario");
        setCurrentText(nextStepInNextScenario.text1);
        //handleNextStep(); // Update text for the first step in the new scenario
      } else {
        console.log('Invalid scenario or step data.');
        //setCurrentText('Invalid scenario or step data.');
      }
    } else {
      if (currentStage === "scenarios") {
        setCurrentStage("afterscenarios");
        updateText(afterscenarios[initialScenario].story[`s1`]);
      } else {
        setLoading(true);
        console.log('All scenarios in this location are completed.');
        setTimeout(() => setFinalText(true), 2000);
        setTimeout(() => renderFinalText(), 2000);
        //setFinalText(true);
        //renderFinalText();
      }
    }
  };

  const renderFinalText = async () => { // renders final text of the game
    const enabledScenariosForLocation = enabledScenarios[newLocation];
  
    let finalText = '';
  
    const promises = [];
  
    for (const scenario of enabledScenariosForLocation) {
      const finalScenario = finalscenarios[scenario];
      if (finalScenario) { // renders game text for the last stage
        const scenarioStory = finalScenario.story;
  
        for (const key in scenarioStory) { // looping through each sentance of the final text
          const insidestep = scenarioStory[key].step;
          const insidescenario = scenarioStory[key].scenario;
          const valdistance = scenarioStory[key].distance;
          const valintimacy = scenarioStory[key].intimacy;
          const valchance = scenarioStory[key].chance;
  
          // checks if the condition is satisfied
          const stepValues = parameterValues[insidescenario]?.[insidestep]; // using optional chaining
          console.log("this is step Values", stepValues);
  
          if ( //checks the values of two out of three parameters
            stepValues &&
            stepValues.distance >= valdistance.min &&
            stepValues.distance <= valdistance.max &&
            stepValues.intimacy >= valintimacy.min &&
            stepValues.intimacy <= valintimacy.max
          ) {
            let textToAdd = scenarioStory[key].text;
  
            // replaces placeholders with variables in the text
            textToAdd = textToAdd.replace(/\${(.*?)}/g, (match, variableName) => {
              const variableValue = variables[variableName];
              return variableValue !== undefined ? variableValue : match;
            });
  
            // checks if the chance value is between 1.001 and 2.000 and if yes procceeds to 'randomizing' the final text
            if (stepValues.chance > 1.000 && stepValues.chance <= 2.000) {
              // adds the promise to the array
              promises.push(processFinalText(textToAdd));
            } else {
              finalText += textToAdd + ' ';
            }
          }
        }
      }
    }
  
    // waits for all promises to resolve
    const processedTexts = await Promise.all(promises);
  
    // adds the processed texts to the final text
    finalText += processedTexts.join(' ');
  
    console.log("Final Text:", finalText);
  
    // once the final text is generated, it sets it to display.
    setCurrentText(finalText);
    setLoading(false);
    
  };
  

  const processFinalText = async (finalText) => { // depending on the chance value, changes the words in a sentance for other associated words
    // splits the finalText into words
    const words = finalText.split(' ');
  
    // processes each word
    const replacedWords = [];
  
    for (const word of words) {
      // skips searching for associated words for certain words
      if (['the', 'in', 'and', 'of', 'a', 'are'].includes(word.toLowerCase())) {
        replacedWords.push(word);
      } else {
        // uses the fetchEmbeddings function to get the top associated words for the current word
        const top5WordsForCurrentWord = await fetchEmbeddings(word);
  
        // randomly selects one word from the top 5 words or keeps the original word if top5WordsForCurrentWord is empty
        const selectedWord =
          top5WordsForCurrentWord.length > 0
            ? top5WordsForCurrentWord[Math.floor(Math.random() * top5WordsForCurrentWord.length)]
            : word;
  
        // adds the selected word to the array
        replacedWords.push(selectedWord);
      }
    }
  
    // joins the replaced words to form the new text
    const newText = replacedWords.join(' ');
  
    console.log('New Text:', newText);
  
    return newText;
  };

  const fetchEmbeddings = async (word) => { // searches for 5 five associated words like in profile page
  
    try {
      if (embeddings02) {
        
        console.log('This is it:', word);
    
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
          console.log('This is TOP 5:', top5Words);
    
          return top5Words;
        } else {
          console.log(`Word '${word}' not found in the embeddings.`);
          setAssociatedWords([]);
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching embeddings:', error);
      setAssociatedWords([]);
      return [];
    } finally {
    }
  };

  const cosineSimilarity = (a, b) => {
    const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const saveFinalText = async () => { // saves final text to Firestore database
    try {
      if (!auth.currentUser) {
        console.error('User not authenticated');
        return;
      }

      const userId = auth.currentUser.uid;
      const userCollectionRef = collection(db, 'allTexts');

      const wordsArray = currentText.split(' ');

      const docRef = await addDoc(userCollectionRef, {
        userid: userId,
        text: currentText, // saves the final text as a string
        words: wordsArray, // saves the array of words so that it can be searched through later
        timestamp: serverTimestamp(),
      });

      console.log('Final Text Document saved with ID: ', docRef.id);

      setFinalText(false);
      navigation.navigate("(profile)", { screen: "index" }); // automatically navigates to the profile page
    } catch (error) {
      console.error('Error saving final text:', error);
    }
  };

  const handleUserInput = () => { // handles text input interaction
    setVariables(prevVariables => ({
      ...prevVariables,
      [scenarios[currentScenario].story[`s${currentStep}`].value]: inputText
    }));
    setInputText('');
    handleNextStep();
    console.log("handling 06");
  };

  const handleOptionClick = (option) => { // handles option click interaction
    const varToUpdate = scenarios[currentScenario].story[`s${currentStep}`][option];
    setVariables(prevVariables => ({
      ...prevVariables,
      [scenarios[currentScenario].story[`s${currentStep}`].value]: varToUpdate
    }));
    handleNextStep();
    console.log("handling 07")
  };

  const renderOptions = () => { // renders game text based on multiple conditions
    console.log("current stage is:", currentStage);
    console.log("current step is:", currentStep);
    console.log("current scenario is:", currentScenario);
    if (finalText) { // if we are at the last stage renders 'save text' button
      return (
        <TouchableOpacity style={styles.optionButton} onPress={() => saveFinalText()}>
          <Text>Save to profile</Text>
        </TouchableOpacity>
      );
    } else {
      if (currentStage === "scenarios"){ // if we are at the first stage
        const currentStepInfo = scenarios[currentScenario].story[`s${currentStep}`];
        if (currentStepInfo) {
          if (Array.isArray(currentStepInfo.options)) {
            if (currentStepInfo.options.includes('yes') && currentStepInfo.options.includes('no')) { // 'yes and no' button user interaction
              return currentStepInfo.options.map((option, index) => (
                <TouchableOpacity key={index} style={styles.optionButton} onPress={() => handleOptionClick(option)}>
                  <Text>{option}</Text>
                </TouchableOpacity>
              ));
            } else {
              return ( // non real-time 'word picker' user interaction
                <Picker
                  selectedValue={variables[currentStepInfo.value]}
                  style={styles.picker}
                  onValueChange={(itemValue) => handlePickerChange(itemValue, currentStepInfo.value)}
                >
                  {currentStepInfo.options.map((option, index) => (
                    <Picker.Item label={option} value={option} key={index} />
                  ))}
                </Picker>
              );
            }
          } else if (currentStepInfo.options === "automatic" && !automaticTriggered) { // automatic transition between two steps
            console.log("handling 02");
            setTimeout(() => handleNextStep(), 2000);
            setAutomaticTriggered(true);
          } else if (currentStepInfo.options === "wordchange") { // real-time word change user interaction with the picker
            if (currentStepInfo.pickeroptions) {
              return (
                <Picker
                  selectedValue={variables[currentStepInfo.value]}
                  style={styles.picker}
                  onValueChange={(itemValue) => handlePickerChange(itemValue, currentStepInfo.value)}
                >
                  {currentStepInfo.pickeroptions.map((option, index) => (
                    <Picker.Item label={option} value={option} key={index} />
                  ))}
                </Picker>
              );
            } else if (!automaticTriggered) {
              console.log("handling 03");
            }
          } else if (currentStepInfo.options === "input") { // free text input user interaction
            return (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Enter input..."
              />
              <Button title="Submit" onPress={handleUserInput} />
            </View>
            );
          }
        }
      } else if (currentStage === "afterscenarios"){ // if the player is at the second 'editing' stage

        const currentStepInfo = afterscenarios[currentScenario].story[`s${currentStep}`];
        console.log("currentStepInfo is:", currentStepInfo);

        if (currentStepInfo) {
          if (Array.isArray(currentStepInfo.options)) {
            if (currentStepInfo.options.includes('yes') && currentStepInfo.options.includes('no')) {
              return currentStepInfo.options.map((option, index) => (
                <TouchableOpacity key={index} style={styles.optionButton} onPress={() => handleOptionClick(option)}>
                  <Text>{option}</Text>
                </TouchableOpacity>
              ));
            } else {
              return (
                <Picker
                  selectedValue={variables[currentStepInfo.value]}
                  style={styles.picker}
                  onValueChange={(itemValue) => handlePickerChange(itemValue, currentStepInfo.value)}
                >
                  {currentStepInfo.options.map((option, index) => (
                    <Picker.Item label={option} value={option} key={index} />
                  ))}
                </Picker>
              );
            }
          } else if (currentStepInfo.options === "automatic" && !automaticTriggered) {
            console.log("handling 02");
            setTimeout(() => handleNextStep(), 2000);
            setAutomaticTriggered(true);
          } else if (currentStepInfo.options === "wordchange") {
            if (currentStepInfo.pickeroptions) { 
              return (
                <Picker
                  selectedValue={variables[currentStepInfo.value]}
                  style={styles.picker}
                  onValueChange={(itemValue) => handlePickerChange(itemValue, currentStepInfo.value)}
                >
                  {currentStepInfo.pickeroptions.map((option, index) => (
                    <Picker.Item label={option} value={option} key={index} />
                  ))}
                </Picker>
              );
            } else if (!automaticTriggered) {
              console.log("handling 03");
              //setTimeout(() => handleNextStep(), 5000);
              setAutomaticTriggered(true);
            }
          } else if (currentStepInfo.options === "button") { // button click user interaction
            return currentStepInfo.buttonoptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.optionButton} onPress={() => handleNextStep()}>
                <Text>{option}</Text>
              </TouchableOpacity>
            ));
          } else if (currentStepInfo.options === "parameters") { // editing of parameters user interaction
            console.log("current scenario is", currentScenario),
            console.log("current step is", currentStep)
            if (variableClicked) {
              return (
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderTitle}>Distance:</Text>
                    <Slider
                      style={styles.sliderPicker}
                      value={parameterValues[currentScenario][currentStep].distance}
                      onValueChange={(value) =>
                        setParameterValues((prevValues) => ({
                          ...prevValues,
                          [currentScenario]: {
                            ...prevValues[currentScenario],
                            [currentStep]: {
                              ...prevValues[currentScenario][currentStep],
                              distance: parseFloat(value.toFixed(3)),
                            },
                          },
                        }))
                      }
                      maximumValue={2}
                    />
                  </View>
                              
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderTitle}>Intimacy:</Text>
                    <Slider
                      style={styles.sliderPicker}
                      value={parameterValues[currentScenario][currentStep].intimacy}
                      onValueChange={(value) =>
                        setParameterValues((prevValues) => ({
                          ...prevValues,
                          [currentScenario]: {
                            ...prevValues[currentScenario],
                            [currentStep]: {
                              ...prevValues[currentScenario][currentStep],
                              intimacy: parseFloat(value.toFixed(3)),
                            },
                          },
                        }))
                      }
                      maximumValue={2}
                    />
                  </View>
            
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderTitle}>Chance:</Text>
                    <Slider
                      style={styles.sliderPicker}
                      value={parameterValues[currentScenario][currentStep].chance}
                      onValueChange={(value) =>
                        setParameterValues((prevValues) => ({
                          ...prevValues,
                          [currentScenario]: {
                            ...prevValues[currentScenario],
                            [currentStep]: {
                              ...prevValues[currentScenario][currentStep],
                              chance: parseFloat(value.toFixed(3)),
                            },
                          },
                        }))
                      }
                      maximumValue={2}
                    />
                  </View>
            
                  <Button title="Submit" onPress={() => handleNextStep()} />
                </View>
              );
            } else {
              return null;
            }
          }
        }
      }
    };
    return null;
  };

  const handlePickerChange = (value, varToUpdate) => { // handles picker value changes
    setVariables(prevVariables => ({
      ...prevVariables,
      [varToUpdate]: value
    }));
    console.log("handoling 04")
    handleNextStep();
  };

  useEffect(() => { // updates text whenever variables change
    console.log("use Effect for variables");
    if(currentStage === "scenarios"){
      updateText(scenarios[currentScenario].story[`s${currentStep}`]);
    } else if (currentStage === "afterscenarios") {
      updateText(afterscenarios[currentScenario].story[`s${currentStep}`]);
    }
  }, [variables]);

  useEffect(() => { // resets the step and conditions when new stage is loaded
    console.log("use Effect for current Scenario change");
    setCurrentStep(1);
    //renderOptions();
    setAutomaticTriggered(false);
  }, [currentScenarioChange]);

  useEffect(() => { 
    console.log("use Effect for current stage");
    setCurrentStep(1);
    setCurrentScenario(initialScenario);
  }, [currentStage]);

  useEffect(() => { // handles loading screen
    console.log("loading state changed", isLoading);
  }, [isLoading]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {/* Your main content when not loading */}
          <View style={styles.textContainer}>
            {Array.isArray(currentText) ? (
              currentText.map((part, index) => (
                <Text key={index} style={styles.clickableText}>
                  {part}
                </Text>
              ))
            ) : (
              <Text style={styles.clickableText}>{currentText}</Text>
            )}
          </View>
          {isRenderAvailable && renderOptions()}
          {isPickerVisible && renderPicker(selectedPickerVariable)}
          {renderNextButton()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  textContainer: {
    marginBottom: 20,
    flexDirection: 'row', 
    flexWrap: 'wrap', 
  },
  clickableText: {
    fontSize: 18,
    textAlign: 'center',
    flexWrap: 'nowrap', 
    margin: 3, 
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
    marginRight: 10,
  },
  optionButton: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  pickerContainer: {
    marginTop: 20,
    backgroundColor: 'transparent', 
  },
  picker: {
    width: 200,
  },
  nextButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#4285F4', 
    borderRadius: 5,
    alignItems: 'center',
  },
  sliderContainer: {
    marginTop: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderTitle: {
    marginRight: 10,
    fontSize: 16,
  },
  sliderPicker: {
    width: 150,
    height: 40,
  },
  
});