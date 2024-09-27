import React from 'react';
import AudioPlayer from './AudioPlayer';

function BookViewer({ story, onClose, onDelete }) {
  return (
    <div className="book-viewer">
      <div className="book-content">
        <h2>{story.title}</h2>
        <img src={story.imageUrl} alt={story.title} className="book-image" />
        <p>{story.content}</p>
        {story.audioUrl && <AudioPlayer audioUrl={story.audioUrl} story={story.content} />}
      </div>
      <div className="book-actions">
        <button onClick={onClose}>Close</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

export default BookViewer;