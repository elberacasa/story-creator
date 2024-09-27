import React, { useState, useEffect } from 'react';
import StoryGenerator from './components/StoryGenerator';
import AudioPlayer from './components/AudioPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import StoryLibrary from './components/StoryLibrary';
import './App.css';

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

  return (
    <ErrorBoundary>
      <div className="App">
        <h1>AI Story Narration</h1>
        <div className="progress-bar">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1. Story Details</div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2. Image Settings</div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3. Audio Settings</div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>4. Final Story</div>
        </div>
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
          <div className="final-story">
            <h2>Your Generated Story</h2>
            <img src={imageUrl} alt="Story illustration" className="story-image" />
            <AudioPlayer audioUrl={audioUrl} story={generatedStory} />
            <button className="reset-button" onClick={resetForm}>Create Another Story</button>
          </div>
        )}
        <StoryLibrary stories={savedStories} onDeleteStory={handleDeleteStory} />
      </div>
    </ErrorBoundary>
  );
}

export default App;