import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, Stepper, Step, StepLabel, Paper, Button } from '@mui/material';
import StoryGenerator from './components/StoryGenerator';
import AudioPlayer from './components/AudioPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import StoryLibrary from './components/StoryLibrary';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#2ecc71',
    },
  },
});

function App() {
  const [generatedStory, setGeneratedStory] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [savedStories, setSavedStories] = useState([]);

  useEffect(() => {
    const stories = JSON.parse(localStorage.getItem('savedStories')) || [];
    setSavedStories(stories);
  }, []);

  const handleStoryGenerated = (story) => {
    setGeneratedStory(story);
    setAudioUrl('');
    setImageUrl('');
    setCurrentStep(2);
  };

  const handleAudioGenerated = (url, story) => {
    setAudioUrl(url);
    setGeneratedStory(story);
    setCurrentStep(4);
  };

  const handleImageGenerated = (url) => {
    setImageUrl(url);
  };

  const resetForm = () => {
    setGeneratedStory('');
    setAudioUrl('');
    setImageUrl('');
    setCurrentStep(1);
  };

  const updateSavedStories = () => {
    const stories = JSON.parse(localStorage.getItem('savedStories')) || [];
    setSavedStories(stories);
  };

  const handleDeleteStory = (index) => {
    const updatedStories = savedStories.filter((_, i) => i !== index);
    setSavedStories(updatedStories);
    localStorage.setItem('savedStories', JSON.stringify(updatedStories));
  };

  const handleOpenBook = (story) => {
    // You can implement any additional logic here if needed
    console.log('Opening book:', story.title);
  };

  const steps = ['Story Details', 'Image Settings', 'Audio Settings', 'Final Story'];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Container maxWidth="md" className="App">
          <Typography variant="h3" component="h1" gutterBottom align="center">
            AI Story Narration
          </Typography>
          <Stepper activeStep={currentStep - 1} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <StoryGenerator 
            onStoryGenerated={handleStoryGenerated} 
            onAudioGenerated={handleAudioGenerated}
            onImageGenerated={handleImageGenerated}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            generatedStory={generatedStory}
            setGeneratedStory={setGeneratedStory}
            updateSavedStories={updateSavedStories}
            onDeleteStory={handleDeleteStory}
            onOpenBook={handleOpenBook}
          />
          {currentStep === 4 && audioUrl && imageUrl && (
            <Paper elevation={3} className="final-story">
              <Typography variant="h4" gutterBottom>Your Generated Story</Typography>
              <img src={imageUrl} alt="Story illustration" className="story-image" />
              <AudioPlayer audioUrl={audioUrl} story={generatedStory} />
              <Button variant="contained" color="primary" onClick={resetForm}>Create Another Story</Button>
            </Paper>
          )}
          <StoryLibrary stories={savedStories} onDeleteStory={handleDeleteStory} />
        </Container>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;