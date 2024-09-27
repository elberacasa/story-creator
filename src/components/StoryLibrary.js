import React, { useState } from 'react';
import BookViewer from './BookViewer'; // We'll create this component next

function StoryLibrary({ stories, onDeleteStory }) {
  const [selectedBook, setSelectedBook] = useState(null);

  const handleBookClick = (story) => {
    setSelectedBook(story);
  };

  const handleCloseBook = () => {
    setSelectedBook(null);
  };

  return (
    <div className="story-library">
      <h2>Your Story Collection</h2>
      <div className="book-shelf">
        {stories.map((story, index) => (
          <div key={index} className="book" onClick={() => handleBookClick(story)}>
            <img src={story.imageUrl} alt={story.title} className="book-cover" />
            <div className="book-title">{story.title}</div>
          </div>
        ))}
      </div>
      {selectedBook && (
        <BookViewer 
          story={selectedBook} 
          onClose={handleCloseBook} 
          onDelete={() => {
            onDeleteStory(stories.indexOf(selectedBook));
            setSelectedBook(null);
          }}
        />
      )}
    </div>
  );
}

export default StoryLibrary;