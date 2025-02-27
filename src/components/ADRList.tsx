import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export const ADRList: React.FC = () => {
  const adrs = useQuery(api.adrs.getAll) || [];
  const [selectedADRs, setSelectedADRs] = useState<Id<"adrs">[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  
  const deleteADR = useMutation(api.adrs.remove);
  
  // Handle selection toggle
  const toggleSelection = (id: Id<"adrs">) => {
    if (!selectMode) return;
    
    setSelectedADRs(prev => {
      if (prev.includes(id)) {
        return prev.filter(adrId => adrId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    if (selectMode) {
      setSelectedADRs([]); // Clear selections when exiting select mode
    }
  };
  
  // Handle batch delete
  const handleBatchDelete = () => {
    if (selectedADRs.length > 0) {
      setShowDeleteConfirm(true);
    }
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    for (const id of selectedADRs) {
      await deleteADR({ id });
    }
    setSelectedADRs([]);
    setShowDeleteConfirm(false);
    setSelectMode(false);
  };
  
  // Group ADRs by status
  const groupedADRs = adrs.reduce((acc, adr) => {
    const status = adr.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(adr);
    return acc;
  }, {} as Record<string, typeof adrs>);
  
  return (
    <div className="adr-list">
      <div className="adr-list-header">
        <h2>Architecture Decisions</h2>
        <div className="adr-list-actions">
          <button
            className={`selection-mode-toggle ${selectMode ? 'active' : ''}`}
            onClick={toggleSelectMode}
          >
            {selectMode ? 'Cancel Selection' : 'Select Multiple'}
          </button>
          
          {selectMode && (
            <button
              className="delete-button"
              onClick={handleBatchDelete}
              disabled={selectedADRs.length === 0}
            >
              Delete Selected ({selectedADRs.length})
            </button>
          )}
        </div>
      </div>
      
      {Object.entries(groupedADRs).map(([status, statusADRs]) => (
        <div key={status} className="status-group">
          <h3>{status.charAt(0).toUpperCase() + status.slice(1)}</h3>
          
          <div className="adr-cards">
            {statusADRs.map((adr) => (
              <div 
                key={adr._id} 
                className={`adr-card ${selectedADRs.includes(adr._id) ? 'selected' : ''} ${selectMode ? 'selectable' : ''}`}
                onClick={() => toggleSelection(adr._id)}
              >
                {selectMode && (
                  <div className="selection-indicator">
                    <input 
                      type="checkbox" 
                      checked={selectedADRs.includes(adr._id)}
                      onChange={() => {}} // Handled by the card click
                      onClick={(e) => e.stopPropagation()} // Prevent duplicate click handling
                    />
                  </div>
                )}
                <h4>{adr.title}</h4>
                <p className="adr-problem">{adr.problem.substring(0, 100)}...</p>
                <div className="adr-tags">
                  {adr.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="adr-date">
                  Updated: {new Date(adr.updatedAt).toLocaleDateString()}
                </div>
                <Link 
                  to={`/adrs/${adr._id}`} 
                  className="view-link"
                  onClick={(e) => selectMode && e.preventDefault()} // Prevent navigation in select mode
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <Link to="/adrs/new" className="create-link">
        + Create New ADR
      </Link>
      
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="status-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedADRs.length} selected ADR{selectedADRs.length !== 1 ? 's' : ''}? This action cannot be undone.</p>
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