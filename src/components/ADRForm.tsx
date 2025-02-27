import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate, useLocation } from 'react-router-dom';

interface Option {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

export const ADRForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState<Option[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      pros: [''],
      cons: [''],
    }
  ]);
  const [decision, setDecision] = useState('');
  const [outcome, setOutcome] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<string>('proposed');
  const [showSuccess, setShowSuccess] = useState(false);
  const [convertedADRId, setConvertedADRId] = useState<string>('');
  const [convertFromInsight, setConvertFromInsight] = useState(false);
  const [insightId, setInsightId] = useState<string>('');
  const [codeReferences, setCodeReferences] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const createADR = useMutation(api.adrs.create);
  const linkInsightToADR = useMutation(api.architectureNotes.convertToADR);
  
  // Check if we're converting from an insight
  useEffect(() => {
    const state = location.state as any;
    if (state && state.convertFromInsight) {
      setConvertFromInsight(true);
      setInsightId(state.insightId);
      setTitle(state.title || '');
      setProblem(state.problem || '');
      if (state.tags && Array.isArray(state.tags)) {
        setTags(state.tags.join(', '));
      }
      if (state.codeReferences && Array.isArray(state.codeReferences)) {
        setCodeReferences(state.codeReferences);
      }
    }
  }, [location]);
  
  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        pros: [''],
        cons: [''],
      }
    ]);
  };
  
  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, index) => index !== indexToRemove));
    }
  };
  
  const handleOptionChange = (index: number, field: keyof Option, value: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setOptions(newOptions);
  };
  
  const handleAddPro = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].pros.push('');
    setOptions(newOptions);
  };
  
  const handleRemovePro = (optionIndex: number, proIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].pros = newOptions[optionIndex].pros.filter((_, index) => index !== proIndex);
    setOptions(newOptions);
  };
  
  const handleAddCon = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].cons.push('');
    setOptions(newOptions);
  };
  
  const handleRemoveCon = (optionIndex: number, conIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].cons = newOptions[optionIndex].cons.filter((_, index) => index !== conIndex);
    setOptions(newOptions);
  };
  
  const handleProChange = (optionIndex: number, proIndex: number, value: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].pros[proIndex] = value;
    setOptions(newOptions);
  };
  
  const handleConChange = (optionIndex: number, conIndex: number, value: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].cons[conIndex] = value;
    setOptions(newOptions);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };
  
  const handleGoToDashboard = () => {
    navigate('/');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty pros and cons
    const cleanedOptions = options.map(option => ({
      ...option,
      pros: option.pros.filter(Boolean),
      cons: option.cons.filter(Boolean),
    }));
    
    try {
      // Create the ADR
      const newADRId = await createADR({
        title,
        status,
        problem,
        context,
        options: cleanedOptions,
        decision,
        outcome,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        relatedADRs: [],
        codeReferences: codeReferences.length > 0 ? codeReferences : [],
      });
      
      // If converting from insight, link the insight to the new ADR
      if (convertFromInsight && insightId) {
        setConvertedADRId(newADRId);
        await linkInsightToADR({
          id: insightId as any,
          adrId: newADRId,
        });
      }
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setTitle('');
      setProblem('');
      setContext('');
      setOptions([{
        id: crypto.randomUUID(),
        title: '',
        description: '',
        pros: [''],
        cons: [''],
      }]);
      setDecision('');
      setOutcome('');
      setTags('');
      setStatus('proposed');
      setCodeReferences([]);
      setConvertFromInsight(false);
      setInsightId('');
      
    } catch (error) {
      console.error('Error creating ADR:', error);
    }
  };
  
  return (
    <div className="adr-form" style={{ width: '100%', maxWidth: '1400px' }}>
      {showSuccess && (
        <div className="success-message">
          <div>
            <p>{convertFromInsight ? "Insight converted to ADR successfully!" : "ADR created successfully!"}</p>
          </div>
          <div>
            <button onClick={handleGoToDashboard}>Go to Dashboard</button>
            <button onClick={handleCloseSuccess}>×</button>
          </div>
        </div>
      )}
      <h2>{convertFromInsight ? "Convert Insight to ADR" : "Create Architecture Decision Record"}</h2>
      {convertFromInsight && (
        <div className="conversion-notice">
          <p>Creating ADR from insight. This will link the original insight to this new ADR.</p>
        </div>
      )}
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
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
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
          <label htmlFor="problem">Problem</label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            required
            rows={3}
            placeholder="What issue does this decision address?"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="context">Context</label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            placeholder="Additional context about the problem"
          />
        </div>
        
        <div className="options-section">
          <h3>Options</h3>
          {options.map((option, index) => (
            <div key={option.id} className="option-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Option {index + 1}</h4>
                {options.length > 1 && (
                  <button 
                    type="button" 
                    className="delete-button" 
                    onClick={() => handleRemoveOption(index)}
                  >
                    Delete Option
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor={`option-title-${index}`}>Title</label>
                <input
                  type="text"
                  id={`option-title-${index}`}
                  value={option.title}
                  onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor={`option-desc-${index}`}>Description</label>
                <textarea
                  id={`option-desc-${index}`}
                  value={option.description}
                  onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                  rows={3}
                  required
                />
              </div>
              
              <div className="pros-cons">
                <div className="pros">
                  <h5>Pros</h5>
                  {option.pros.map((pro, proIndex) => (
                    <div key={`pro-${index}-${proIndex}`} style={{ display: 'flex', marginBottom: '5px' }}>
                      <input
                        type="text"
                        value={pro}
                        onChange={(e) => handleProChange(index, proIndex, e.target.value)}
                        placeholder="Advantage"
                        style={{ flexGrow: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemovePro(index, proIndex)}
                        style={{ marginLeft: '10px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddPro(index)}>
                    + Add Pro
                  </button>
                </div>
                
                <div className="cons">
                  <h5>Cons</h5>
                  {option.cons.map((con, conIndex) => (
                    <div key={`con-${index}-${conIndex}`} style={{ display: 'flex', marginBottom: '5px' }}>
                      <input
                        type="text"
                        value={con}
                        onChange={(e) => handleConChange(index, conIndex, e.target.value)}
                        placeholder="Disadvantage"
                        style={{ flexGrow: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCon(index, conIndex)}
                        style={{ marginLeft: '10px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddCon(index)}>
                    + Add Con
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={handleAddOption}>
            + Add Another Option
          </button>
        </div>
        
        <div className="form-group">
          <label htmlFor="decision">Decision</label>
          <textarea
            id="decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            required
            rows={4}
            placeholder="The chosen solution and why"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="outcome">Expected Outcome</label>
          <textarea
            id="outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={3}
            placeholder="The expected or observed result of this decision"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="database, security, frontend"
          />
        </div>
        
        <button type="submit">Save ADR</button>
      </form>
    </div>
  );
};