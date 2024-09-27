import React, { useState, useEffect, useRef } from 'react';
import StoryPreview from './StoryPreview';

function SavedStories({ onLoadStory, onStoryChange, onDeleteStory, onOpenBook }) {
  const [savedStories, setSavedStories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [previewStory, setPreviewStory] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    const stories = JSON.parse(localStorage.getItem('savedStories')) || [];
    setSavedStories(stories);
  }, []);

  const filteredStories = savedStories.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedIndex(-1);
  };

  const handleLoadStory = (story) => {
    onLoadStory(story);
  };

  const handleDeleteStory = (index) => {
    const updatedStories = savedStories.filter((_, i) => i !== index);
    localStorage.setItem('savedStories', JSON.stringify(updatedStories));
    setSavedStories(updatedStories);
    onStoryChange();
    if (onDeleteStory) {
      onDeleteStory(index);
    }
  };

  const handlePreviewStory = (story) => {
    setPreviewStory(story);
  };

  const closePreview = () => {
    setPreviewStory(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredStories.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex !== -1) {
      handleLoadStory(filteredStories[selectedIndex]);
    }
  };

  useEffect(() => {
    if (selectedIndex !== -1 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="saved-stories" onKeyDown={handleKeyDown} tabIndex="0">
      <h3>Saved Stories</h3>
      <input
        type="text"
        placeholder="Search stories..."
        onChange={handleSearchChange}
        className="search-input"
      />
      {filteredStories.length === 0 ? (
        <p>No saved stories found.</p>
      ) : (
        <ul className="story-list" ref={listRef}>
          {filteredStories.map((story, index) => (
            <li
              key={index}
              className={`story-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="story-title" onClick={() => onOpenBook(story)}>{story.title}</span>
              <div className="story-actions">
                <button onClick={() => handlePreviewStory(story)} className="preview-btn">Preview</button>
                <button onClick={() => handleLoadStory(story)} className="load-btn">Load</button>
                <button onClick={() => handleDeleteStory(index)} className="delete-btn">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {previewStory && (
        <StoryPreview story={previewStory} onClose={closePreview} />
      )}
    </div>
  );
}

export default SavedStories;