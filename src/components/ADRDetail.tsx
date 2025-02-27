import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export const ADRDetail: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;
  
  // Make sure we have a valid ID
  const validId = id && typeof id === 'string' && id.trim() !== '';
  
  // Transform the id string to a proper convex ID to avoid casting issues
  let adrId: Id<"adrs"> | null = null;
  try {
    if (validId) {
      adrId = id as Id<"adrs">;
    }
  } catch (e) {
    console.error("Invalid ID format:", e);
  }
  
  // Only query if we have a valid ID
  const adr = useQuery(
    api.adrs.getById, 
    adrId ? { id: adrId } : "skip"
  );
  
  // Fetch related insights
  const relatedInsights = useQuery(
    api.architectureNotes.getByAdrId, 
    validId ? { adrId: id } : "skip"
  ) || [];
  
  const [statusReason, setStatusReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRelatedInsights, setShowRelatedInsights] = useState(true);
  
  const navigate = useNavigate();
  const updateStatus = useMutation(api.adrs.updateStatus);
  const deleteADR = useMutation(api.adrs.remove);
  
  const handleDeleteADR = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (adrId) {
      try {
        await deleteADR({ id: adrId });
        navigate('/adrs');
      } catch (error) {
        console.error("Error deleting ADR:", error);
      }
    }
  };
  
  if (!validId) {
    return <div className="adr-detail" style={{ width: '100%', maxWidth: '1400px' }}>
      <p>Invalid ADR ID</p>
      <Link to="/adrs">Back to ADRs</Link>
    </div>;
  }

  if (adr === undefined) {
    return <div className="adr-detail" style={{ width: '100%', maxWidth: '1400px' }}>
      <div className="loading-indicator">Loading...</div>
    </div>;
  }
  
  if (adr === null) {
    return <div className="adr-detail" style={{ width: '100%', maxWidth: '1400px' }}>
      <p>ADR not found</p>
      <Link to="/adrs">Back to ADRs</Link>
    </div>;
  }
  
  const handleStatusChange = async () => {
    if (!newStatus || !statusReason || !adr) return;
    
    try {
      await updateStatus({
        id: adr._id,
        newStatus,
        reason: statusReason,
      });
      
      setShowStatusModal(false);
      setStatusReason('');
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  
  return (
    <div className="adr-detail" style={{ width: '100%', maxWidth: '1400px' }}>
      <div className="adr-header">
        <h2>{adr.title}</h2>
        <div className="adr-meta">
          <span className={`status status-${adr.status}`}>
            {adr.status}
          </span>
          <span className="date">
            Created: {new Date(adr.createdAt).toLocaleDateString()}
          </span>
          <span className="date">
            Updated: {new Date(adr.updatedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="adr-tags">
          {adr.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="adr-section">
        <h3>Problem</h3>
        <p>{adr.problem}</p>
      </div>
      
      <div className="adr-section">
        <h3>Context</h3>
        <p>{adr.context}</p>
      </div>
      
      <div className="adr-section">
        <h3>Options Considered</h3>
        {adr.options.map((option) => (
          <div key={option.id} className="option">
            <h4>{option.title}</h4>
            <p>{option.description}</p>
            
            <div className="pros-cons">
              <div className="pros">
                <h5>Pros</h5>
                <ul>
                  {option.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>
              
              <div className="cons">
                <h5>Cons</h5>
                <ul>
                  {option.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="adr-section">
        <h3>Decision</h3>
        <p>{adr.decision}</p>
      </div>
      
      <div className="adr-section">
        <h3>Expected Outcome</h3>
        <p>{adr.outcome}</p>
      </div>
      
      {adr.codeReferences.length > 0 && (
        <div className="adr-section">
          <h3>Code References</h3>
          {adr.codeReferences.map((ref) => (
            <div key={ref.id} className="code-reference">
              <h4>{ref.path}</h4>
              <p>{ref.description}</p>
              {ref.snippet && (
                <pre className="code-snippet">
                  <code>{ref.snippet}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="adr-section">
        <h3>Status History</h3>
        <div className="status-timeline">
          {adr.statusHistory.map((change) => (
            <div key={change.id} className="status-change">
              <div className="change-info">
                <span className="change-date">
                  {new Date(change.date).toLocaleDateString()}
                </span>
                <span className="status-transition">
                  {change.from ? `${change.from} → ${change.to}` : change.to}
                </span>
              </div>
              <p className="change-reason">{change.reason}</p>
            </div>
          ))}
        </div>
      </div>
      
      {relatedInsights.length > 0 && (
        <div className="adr-section">
          <div className="section-header-with-toggle">
            <h3>Related Insights</h3>
            <button 
              className="icon-button"
              onClick={() => setShowRelatedInsights(!showRelatedInsights)}
            >
              {showRelatedInsights ? '▲' : '▼'}
            </button>
          </div>
          
          {showRelatedInsights && (
            <div className="related-insights">
              {relatedInsights.map((insight) => (
                <div key={insight._id} className="insight-card-mini">
                  <h4>{insight.title}</h4>
                  <div className="insight-date">
                    {new Date(insight.createdAt).toLocaleDateString()}
                  </div>
                  <p className="insight-excerpt">
                    {insight.content.length > 150 
                      ? `${insight.content.substring(0, 150)}...` 
                      : insight.content}
                  </p>
                  {insight.tags.length > 0 && (
                    <div className="insight-tags">
                      {insight.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <Link to="/insights" className="view-link">
                    View in Insights
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="adr-actions">
        <button
          onClick={() => setShowStatusModal(true)}
          className="status-button"
        >
          Update Status
        </button>
        <button
          onClick={handleDeleteADR}
          className="delete-button"
        >
          Delete ADR
        </button>
      </div>
      
      {showStatusModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}></div>
          <div className="status-modal">
            <h3>Update ADR Status</h3>
            <div className="form-group">
              <label htmlFor="newStatus">New Status</label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
              >
                <option value="">Select Status</option>
                <option value="proposed">Proposed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="deprecated">Deprecated</option>
                <option value="superseded">Superseded</option>
                <option value="hypothesized">Hypothesized</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="statusReason">Reason for Change</label>
              <textarea
                id="statusReason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
                rows={3}
              />
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button onClick={handleStatusChange} className="primary">
                Update Status
              </button>
            </div>
          </div>
        </>
      )}
      
      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="status-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this ADR? This action cannot be undone.</p>
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