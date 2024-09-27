import React, { useState, useEffect, useCallback } from 'react';
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
    <div className="story-generator">
      {currentStep === 1 && (
        <>
          <h2>Step 1: Story Details</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Child's Name"
          />
          <input
            type="number"
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            placeholder="Child's Age"
          />
          <input
            type="text"
            value={storyTheme}
            onChange={(e) => setStoryTheme(e.target.value)}
            placeholder="Story Theme (e.g., Adventure, Friendship)"
          />
          <input
            type="text"
            value={storyMoral}
            onChange={(e) => setStoryMoral(e.target.value)}
            placeholder="Moral Lesson"
          />
          <select
            value={contentFilter}
            onChange={(e) => setContentFilter(e.target.value)}
          >
            <option value="family-friendly">Family Friendly</option>
            <option value="educational">Educational</option>
            <option value="fantasy">Fantasy</option>
          </select>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Additional story details or elements..."
          />
          <button onClick={generateStory} disabled={loading || childName.trim() === '' || childAge === ''}>
            {loading ? 'Generating Story...' : 'Generate Story'}
          </button>
          <button onClick={() => setCurrentStep(2)} disabled={!generatedStory.trim()}>Next: Image Settings</button>
          <SavedStories key={savedStoriesKey} onLoadStory={loadStory} onStoryChange={handleStoryChange} />
        </>
      )}

      {currentStep === 2 && (
        <>
          <h2>Step 2: Image Settings</h2>
          <h3>Generated Story:</h3>
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Enter a title for your story"
          />
          <textarea
            className="story-text"
            value={generatedStory}
            onChange={(e) => setGeneratedStory(e.target.value)}
            placeholder="Your generated story will appear here. You can edit it directly."
          />
          <button onClick={saveStory} disabled={!generatedStory.trim()}>Save Story</button>
          <button className="expand-button" onClick={expandStory} disabled={isExpanding || !generatedStory.trim()}>
            {isExpanding ? 'Expanding Story...' : 'Expand Story'}
          </button>
          <button onClick={generateImage} disabled={loading || !generatedStory.trim()}>
            {loading ? 'Generating Image...' : 'Generate Image'}
          </button>
          {generatedImageUrl && (
            <div className="generated-image">
              <img src={generatedImageUrl} alt="Generated story illustration" />
              <button onClick={generateImage} disabled={loading}>
                {loading ? 'Regenerating Image...' : 'Regenerate Image'}
              </button>
            </div>
          )}
          <button onClick={() => setCurrentStep(1)}>Back to Story Details</button>
          <button onClick={() => setCurrentStep(3)} disabled={!generatedImageUrl}>Next: Audio Settings</button>
        </>
      )}

      {currentStep === 3 && (
        <>
          <h2>Step 3: Audio Settings</h2>
          <div className="form-group">
            <label htmlFor="audioProvider">Audio Provider:</label>
            <select
              id="audioProvider"
              value={audioProvider}
              onChange={(e) => setAudioProvider(e.target.value)}
            >
              <option value="elevenlabs">ElevenLabs (High Quality)</option>
              <option value="openai">OpenAI (Basic)</option>
            </select>
          </div>

          {audioProvider === 'elevenlabs' && voices.length > 0 ? (
            <div className="form-group">
              <label htmlFor="elevenLabsVoice">ElevenLabs Voice:</label>
              <select
                id="elevenLabsVoice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          ) : audioProvider === 'openai' ? (
            <div className="form-group">
              <label htmlFor="openAIVoice">OpenAI Voice:</label>
              <select
                id="openAIVoice"
                value={openAIVoice}
                onChange={(e) => setOpenAIVoice(e.target.value)}
              >
                {openAIVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <h3>Generated Story:</h3>
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Enter a title for your story"
          />
          <textarea
            className="story-text"
            value={generatedStory}
            onChange={(e) => setGeneratedStory(e.target.value)}
            placeholder="Your generated story will appear here. You can edit it directly."
          />
          <button onClick={saveStory}>Save Story</button>
          <button className="expand-button" onClick={expandStory} disabled={isExpanding || !generatedStory.trim()}>
            {isExpanding ? 'Expanding Story...' : 'Expand Story'}
          </button>
          <button onClick={generateAudio} disabled={loading || !generatedStory.trim()}>
            {loading ? 'Generating Audio...' : 'Generate Audio'}
          </button>
          <button onClick={() => setCurrentStep(2)}>Back to Image Settings</button>
        </>
      )}

      {error && <p className="error-message">{error}</p>}
      {loading && <LoadingSpinner />}
    </div>
  );
}

export default StoryGenerator;
