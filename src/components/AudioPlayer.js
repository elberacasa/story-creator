import React, { useRef, useEffect } from 'react';
import SynchronizedStoryDisplay from './SynchronizedStoryDisplay';

function AudioPlayer({ audioUrl, story }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handleWordClick = (index) => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      const wordDuration = audioRef.current.duration / story.split(/\s+/).length;
      audioRef.current.currentTime = index * wordDuration;
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} controls src={audioUrl}>
        Your browser does not support the audio element.
      </audio>
      <SynchronizedStoryDisplay 
        story={story} 
        audioRef={audioRef} 
        onWordClick={handleWordClick}
      />
    </div>
  );
}

export default AudioPlayer;