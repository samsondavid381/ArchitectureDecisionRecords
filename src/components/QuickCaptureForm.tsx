// src/components/QuickCaptureForm.tsx
import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export const QuickCaptureForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [codePath, setCodePath] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  
  const createNote = useMutation(api.architectureNotes.create);
  
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createNote({
        title,
        content,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        codeReferences: codePath ? [
          {
            id: crypto.randomUUID(),
            path: codePath,
            snippet: codeSnippet || undefined,
            description: 'Referenced during quick capture',
          }
        ] : [],
        // Remove the createdAt field as it's handled by the mutation
      });
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setCodePath('');
      setCodeSnippet('');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating insight:', error);
    }
  };
  
  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };
  
  return (
    <div className="quick-capture-form" style={{ width: '100%', maxWidth: '1400px' }}>
      {showSuccess && (
        <div className="success-message">
          <div>
            <p>Insight captured successfully!</p>
          </div>
          <div>
            <button onClick={handleCloseSuccess}>×</button>
          </div>
        </div>
      )}
      <h2>Quick Capture</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="api, authentication, frontend"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="codePath">Code Path (optional)</label>
          <input
            type="text"
            id="codePath"
            value={codePath}
            onChange={(e) => setCodePath(e.target.value)}
            placeholder="src/components/Auth.tsx"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="codeSnippet">Code Snippet (optional)</label>
          <textarea
            id="codeSnippet"
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={4}
            placeholder="// Relevant code here"
          />
        </div>
        
        <button type="submit">Save Insight</button>
      </form>
    </div>
  );
};