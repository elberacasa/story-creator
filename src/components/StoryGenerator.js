import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Paper, Grid, Box} from '@mui/material';
import { styled } from '@mui/material/styles';
import OpenAI from 'openai';
import SavedStories from './SavedStories';
import LoadingSpinner from './LoadingSpinner';
import { generateImagePrompt } from '../utils/imagePrompt';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: This is not recommended for production
});

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  // Add more languages as needed
];

const openAIVoices = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

// Create a styled version of FormControl to maintain consistent height
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 14px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -6px) scale(0.75)',
  },
  '& .MuiSelect-select': {
    paddingTop: '14px',
    paddingBottom: '14px',
  },
}));

function StoryGenerator({ onStoryGenerated, onAudioGenerated, onImageGenerated, currentStep, setCurrentStep, generatedStory, setGeneratedStory, updateSavedStories }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [language, setLanguage] = useState('en');
  
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [storyTheme, setStoryTheme] = useState('');
  const [storyMoral, setStoryMoral] = useState('');
  const [contentFilter, setContentFilter] = useState('family-friendly');

  const [audioProvider, setAudioProvider] = useState('elevenlabs');
  const [openAIVoice, setOpenAIVoice] = useState('alloy');

  const [isExpanding, setIsExpanding] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');

  const [savedStoriesKey, setSavedStoriesKey] = useState(0);

  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  const fetchVoices = useCallback(async () => {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.REACT_APP_ELEVENLABS_API_KEY,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched voices:', data.voices);
      if (data.voices && Array.isArray(data.voices)) {
        // Remove language filtering for now
        setVoices(data.voices);
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        } else {
          setSelectedVoice('');
        }
      } else {
        throw new Error('Invalid response format from ElevenLabs API');
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      setError(`Failed to fetch voice options: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const generateStory = async () => {
    setLoading(true);
    setError('');
    try {
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        throw new Error('OpenAI API key is missing');
      }

      const customInstructions = `
        Generate a short story in ${languages.find(lang => lang.code === language).name} for a ${childAge}-year-old child named ${childName}.
        Theme: ${storyTheme}
        Moral lesson: ${storyMoral}
        Content filter: ${contentFilter}
        Additional prompt: ${prompt}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: `You are a creative storyteller for children. Respond in ${languages.find(lang => lang.code === language).name}.`},
          {role: "user", content: customInstructions}
        ],
        max_tokens: 500,
        n: 1,
        stop: null,
        temperature: 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('Invalid response from OpenAI API');
      }

      const story = response.choices[0].message.content.trim();
      setGeneratedStory(story);
      onStoryGenerated(story);
    } catch (error) {
      console.error('Error generating story:', error);
      setError(`An error occurred while generating the story: ${error.message}`);
    }
    setLoading(false);
  };

  const expandStory = async () => {
    setIsExpanding(true);
    setError('');
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: `You are a creative storyteller for children. Continue the following story, adding more details, dialogue, and events. Keep the same characters, theme, and moral. Do not rewrite or summarize the existing story, only add new content. Respond in ${languages.find(lang => lang.code === language).name}.`},
          {role: "user", content: `Existing story: ${generatedStory}\n\nContinue the story from here:`}
        ],
        max_tokens: 500,
        n: 1,
        stop: null,
        temperature: 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('Invalid response from OpenAI API');
      }

      const newContent = response.choices[0].message.content.trim();
      const expandedStory = `${generatedStory}\n\n${newContent}`;
      setGeneratedStory(expandedStory);
      onStoryGenerated(expandedStory);
    } catch (error) {
      console.error('Error expanding story:', error);
      setError(`An error occurred while expanding the story: ${error.message}`);
    }
    setIsExpanding(false);
  };

  const generateImage = async () => {
    setLoading(true);
    setError('');
    try {
      const imagePrompt = generateImagePrompt(generatedStory, storyTheme, childAge);
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
        quality: "standard",
        style: "natural",
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Invalid response from OpenAI API');
      }

      const imageUrl = response.data[0].url;
      setGeneratedImageUrl(imageUrl);
      onImageGenerated(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      setError(`An error occurred while generating the image: ${error.message}`);
    }
    setLoading(false);
  };

  const generateAudio = async () => {
    setLoading(true);
    setError('');
    try {
      let audioUrl;
      if (audioProvider === 'elevenlabs') {
        // ElevenLabs audio generation logic
        const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': process.env.REACT_APP_ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: generatedStory,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          }),
        });

        if (!audioResponse.ok) {
          const errorData = await audioResponse.json();
          throw new Error(`Failed to generate audio: ${JSON.stringify(errorData)}`);
        }

        const audioBlob = await audioResponse.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      } else {
        // OpenAI audio generation logic
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: openAIVoice,
          input: generatedStory,
        });

        const audioArrayBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(audioBlob);
      }
      onAudioGenerated(audioUrl, generatedStory);
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(`An error occurred while generating the audio: ${error.message}`);
    }
    setLoading(false);
  };

  const saveStory = () => {
    if (!storyTitle.trim() || !generatedStory.trim()) {
      setError('Please provide a title and generate a story before saving.');
      return;
    }

    const storyToSave = {
      title: storyTitle,
      content: generatedStory,
      language,
      childName,
      childAge,
      storyTheme,
      storyMoral,
      contentFilter,
      prompt,
      imageUrl: generatedImageUrl,
    };

    const savedStories = JSON.parse(localStorage.getItem('savedStories')) || [];
    savedStories.push(storyToSave);
    localStorage.setItem('savedStories', JSON.stringify(savedStories));

    setError('');
    alert('Story saved successfully!');
    updateSavedStories();
  };

  const loadStory = (story) => {
    setStoryTitle(story.title);
    setGeneratedStory(story.content);
    setLanguage(story.language);
    setChildName(story.childName);
    setChildAge(story.childAge);
    setStoryTheme(story.storyTheme);
    setStoryMoral(story.storyMoral);
    setContentFilter(story.contentFilter);
    setPrompt(story.prompt);
    setCurrentStep(2);
  };

  const handleStoryChange = () => {
    setSavedStoriesKey(prevKey => prevKey + 1);
  };

  return (
    <Paper elevation={3} className="story-generator">
      {currentStep === 1 && (
        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
          <Box gridColumn="span 12">
            <Typography variant="h5" gutterBottom>Step 1: Story Details</Typography>
          </Box>
          <Box gridColumn="span 6">
            <StyledFormControl fullWidth>
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
                ))}
              </Select>
            </StyledFormControl>
          </Box>
          <Box gridColumn="span 6">
            <TextField
              fullWidth
              placeholder="Child's Name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 6">
            <TextField
              fullWidth
              placeholder="Child's Age"
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 6">
            <TextField
              fullWidth
              placeholder="Story Theme (e.g., Adventure, Friendship)"
              value={storyTheme}
              onChange={(e) => setStoryTheme(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 6">
            <TextField
              fullWidth
              placeholder="Moral Lesson"
              value={storyMoral}
              onChange={(e) => setStoryMoral(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 6">
            <StyledFormControl fullWidth>
              <InputLabel id="content-filter-label">Content Filter</InputLabel>
              <Select
                labelId="content-filter-label"
                value={contentFilter}
                label="Content Filter"
                onChange={(e) => setContentFilter(e.target.value)}
              >
                <MenuItem value="family-friendly">Family Friendly</MenuItem>
                <MenuItem value="educational">Educational</MenuItem>
                <MenuItem value="fantasy">Fantasy</MenuItem>
              </Select>
            </StyledFormControl>
          </Box>
          <Box gridColumn="span 12">
            <TextField
              fullWidth
              placeholder="Additional story details or elements..."
              multiline
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="primary"
              onClick={generateStory} 
              disabled={loading || childName.trim() === '' || childAge === ''}
            >
              {loading ? 'Generating Story...' : 'Generate Story'}
            </Button>
          </Box>
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => setCurrentStep(2)}
              disabled={!generatedStory.trim()}
            >
              Next: Image Settings
            </Button>
          </Box>
          <Box gridColumn="span 12">
            <SavedStories key={savedStoriesKey} onLoadStory={loadStory} onStoryChange={handleStoryChange} />
          </Box>
        </Box>
      )}

      {currentStep === 2 && (
        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
          <Box gridColumn="span 12">
            <Typography variant="h5" gutterBottom>Step 2: Image Settings</Typography>
          </Box>
          <Box gridColumn="span 12">
            <Typography variant="h6" gutterBottom>Generated Story:</Typography>
          </Box>
          <Box gridColumn="span 12">
            <TextField
              fullWidth
              placeholder="Enter a title for your story"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 12">
            <TextField
              fullWidth
              placeholder="Your generated story will appear here. You can edit it directly."
              multiline
              rows={4}
              value={generatedStory}
              onChange={(e) => setGeneratedStory(e.target.value)}
            />
          </Box>
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="primary"
              onClick={saveStory}
              disabled={!generatedStory.trim()}
            >
              Save Story
            </Button>
          </Box>
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="secondary"
              onClick={expandStory}
              disabled={isExpanding || !generatedStory.trim()}
            >
              {isExpanding ? 'Expanding Story...' : 'Expand Story'}
            </Button>
          </Box>
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="primary"
              onClick={generateImage}
              disabled={loading || !generatedStory.trim()}
            >
              {loading ? 'Generating Image...' : 'Generate Image'}
            </Button>
          </Box>
          {generatedImageUrl && (
            <Box gridColumn="span 12">
              <div className="generated-image">
                <img src={generatedImageUrl} alt="Generated story illustration" />
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={generateImage}
                  disabled={loading}
                >
                  {loading ? 'Regenerating Image...' : 'Regenerate Image'}
                </Button>
              </div>
            </Box>
          )}
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => setCurrentStep(1)}
            >
              Back to Story Details
            </Button>
          </Box>
          <Box gridColumn="span 12">
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setCurrentStep(3)}
              disabled={!generatedImageUrl}
            >
              Next: Audio Settings
            </Button>
          </Box>
        </Box>
      )}

      {currentStep === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>Step 3: Audio Settings</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Audio Provider</InputLabel>
              <Select
                value={audioProvider}
                onChange={(e) => setAudioProvider(e.target.value)}
              >
                <MenuItem value="elevenlabs">ElevenLabs (High Quality)</MenuItem>
                <MenuItem value="openai">OpenAI (Basic)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {audioProvider === 'elevenlabs' && voices.length > 0 && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>ElevenLabs Voice</InputLabel>
                <Select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {voices.map((voice) => (
                    <MenuItem key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          {audioProvider === 'openai' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>OpenAI Voice</InputLabel>
                <Select
                  value={openAIVoice}
                  onChange={(e) => setOpenAIVoice(e.target.value)}
                >
                  {openAIVoices.map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Generated Story:</Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Enter a title for your story"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Your generated story will appear here. You can edit it directly."
              multiline
              rows={4}
              value={generatedStory}
              onChange={(e) => setGeneratedStory(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={saveStory}
              disabled={!generatedStory.trim()}
            >
              Save Story
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={expandStory}
              disabled={isExpanding || !generatedStory.trim()}
            >
              {isExpanding ? 'Expanding Story...' : 'Expand Story'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={generateAudio}
              disabled={loading || !generatedStory.trim()}
            >
              {loading ? 'Generating Audio...' : 'Generate Audio'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => setCurrentStep(2)}
            >
              Back to Image Settings
            </Button>
          </Grid>
        </Grid>
      )}

      {error && (
        <Typography color="error" className="error-message">{error}</Typography>
      )}
      {loading && <LoadingSpinner />}
    </Paper>
  );
}

export default StoryGenerator;

