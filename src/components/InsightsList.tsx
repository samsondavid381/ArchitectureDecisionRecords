// src/components/InsightsList.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useNavigate } from 'react-router-dom';

export const InsightsList: React.FC = () => {
  const insights = useQuery(api.architectureNotes.getAll) || [];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInsightId, setSelectedInsightId] = useState<Id<"architectureNotes"> | null>(null);
  const [insightToConvert, setInsightToConvert] = useState<any>(null);
  
  const navigate = useNavigate();
  const deleteInsight = useMutation(api.architectureNotes.remove);
  const linkInsightToADR = useMutation(api.architectureNotes.convertToADR);
  
  const handleDeleteClick = (id: Id<"architectureNotes">) => {
    setSelectedInsightId(id);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (selectedInsightId) {
      await deleteInsight({ id: selectedInsightId });
      setShowDeleteConfirm(false);
      setSelectedInsightId(null);
    }
  };
  
  const handleConvertToADR = (insight: any) => {
    // Store insight data in state
    setInsightToConvert(insight);
    
    // Navigate to the ADR creation form with insight data
    navigate('/adrs/new', { 
      state: { 
        convertFromInsight: true, 
        insightId: insight._id,
        title: insight.title,
        problem: insight.content,
        tags: insight.tags,
        codeReferences: insight.codeReferences
      } 
    });
  };
  
  // Track expanded insights in a map for individual toggling
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});
  
  const toggleDetails = (id: Id<"architectureNotes">) => {
    setExpandedInsights(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  if (insights.length === 0) {
    return (
      <div className="insights-list">
        <h2>Architecture Insights</h2>
        <p className="empty-state">No insights captured yet. Use Quick Capture to add insights.</p>
      </div>
    );
  }
  
  return (
    <div className="insights-list">
      <h2>Architecture Insights</h2>
      <div className="insights-grid">
        {insights.map((insight) => (
          <div key={insight._id} className="insight-card">
            <div className="insight-header">
              <h3>{insight.title}</h3>
              <div className="insight-actions">
                <button 
                  type="button" 
                  className="icon-button"
                  onClick={() => toggleDetails(insight._id)}
                >
                  {expandedInsights[insight._id] ? '▲' : '▼'}
                </button>
                <button 
                  type="button" 
                  className="convert-button"
                  onClick={() => handleConvertToADR(insight)}
                >
                  Convert to ADR
                </button>
                <button 
                  type="button" 
                  className="delete-button"
                  onClick={() => handleDeleteClick(insight._id)}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="insight-date">
              {new Date(insight.createdAt).toLocaleDateString()}
            </div>
            
            {insight.tags.length > 0 && (
              <div className="adr-tags">
                {insight.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {expandedInsights[insight._id] && (
              <div className="insight-details">
                <p className="insight-content">{insight.content}</p>
                
                {insight.codeReferences && insight.codeReferences.length > 0 && (
                  <div className="code-references">
                    <h4>Code References</h4>
                    {insight.codeReferences.map((ref) => (
                      <div key={ref.id} className="code-reference">
                        <p className="code-path">{ref.path}</p>
                        {ref.snippet && (
                          <pre className="code-snippet">
                            <code>{ref.snippet}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {insight.adrId && (
                  <div className="insight-adr-ref">
                    <p>Associated with ADR: {insight.adrId}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="status-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this insight? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button onClick={confirmDelete} className="delete-button">
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};