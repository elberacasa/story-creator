import React from 'react';

function StoryPreview({ story, onClose }) {
  return (
    <div className="story-preview-modal">
      <div className="story-preview-content">
        <h4>{story.title}</h4>
        <p>{story.content}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default StoryPreview;