import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import AudioPlayer from './AudioPlayer';

function BookViewer({ story, onClose, onDelete }) {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{story.title}</DialogTitle>
      <DialogContent>
        <img src={story.imageUrl} alt={story.title} style={{ width: '100%', marginBottom: '1rem' }} />
        <Typography variant="body1" paragraph>{story.content}</Typography>
        {story.audioUrl && <AudioPlayer audioUrl={story.audioUrl} story={story.content} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
        <Button onClick={onDelete} color="secondary">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BookViewer;