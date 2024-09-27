import React, { useState, useEffect, useRef } from 'react';

function SynchronizedStoryDisplay({ story, audioRef, onWordClick }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = story.split(/\s+/);
  const containerRef = useRef(null);
  const wordTimestamps = useRef([]);

  useEffect(() => {
    const generateTimestamps = () => {
      const audioLength = audioRef.current ? audioRef.current.duration : 0;
      if (isFinite(audioLength) && audioLength > 0) {
        const avgWordDuration = audioLength / words.length;
        wordTimestamps.current = words.map((_, index) => index * avgWordDuration);
      }
    };

    const audio = audioRef.current;
    if (audio) {
      generateTimestamps();
      audio.addEventListener('loadedmetadata', generateTimestamps);

      return () => {
        if (audio) {
          audio.removeEventListener('loadedmetadata', generateTimestamps);
        }
      };
    }
  }, [words, audioRef]);

  useEffect(() => {
    const updateCurrentWord = () => {
      if (audioRef.current && isFinite(audioRef.current.duration)) {
        const currentTime = audioRef.current.currentTime;
        const newIndex = wordTimestamps.current.findIndex(
          (timestamp, index) => 
            currentTime >= timestamp && 
            (index === words.length - 1 || currentTime < wordTimestamps.current[index + 1])
        );
        if (newIndex !== -1 && newIndex !== currentWordIndex) {
          setCurrentWordIndex(newIndex);
        }
      }
    };

    const intervalId = setInterval(updateCurrentWord, 50);
    return () => clearInterval(intervalId);
  }, [audioRef, words.length, currentWordIndex]);

  useEffect(() => {
    if (containerRef.current) {
      const activeWord = containerRef.current.querySelector('.active-word');
      if (activeWord) {
        activeWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentWordIndex]);

  const handleWordClick = (index) => {
    if (audioRef.current && isFinite(audioRef.current.duration) && wordTimestamps.current[index] !== undefined) {
      audioRef.current.currentTime = wordTimestamps.current[index];
      onWordClick(index);
    }
  };

  return (
    <div className="synchronized-story" ref={containerRef}>
      {words.map((word, index) => (
        <span
          key={index}
          className={index === currentWordIndex ? 'active-word' : ''}
          onClick={() => handleWordClick(index)}
        >
          {word}{' '}
        </span>
      ))}
    </div>
  );
}

export default SynchronizedStoryDisplay;