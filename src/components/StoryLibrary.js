import React, { useState } from 'react';
import { Typography, Grid, Card, CardMedia, CardContent, CardActionArea } from '@mui/material';
import BookViewer from './BookViewer';

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
      <Typography variant="h4" gutterBottom>Your Story Collection</Typography>
      <Grid container spacing={3}>
        {stories.map((story, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardActionArea onClick={() => handleBookClick(story)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={story.imageUrl}
                  alt={story.title}
                />
                <CardContent>
                  <Typography variant="h6" component="div">
                    {story.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
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