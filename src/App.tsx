// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import './App.css';

// Import components
import { QuickCaptureForm } from './components/QuickCaptureForm';
import { ADRList } from './components/ADRList';
import { ADRDetail } from './components/ADRDetail';
import { ADRForm } from './components/ADRForm';
import { ArchitectureMap } from './components/ArchitectureMap';
import { InsightsList } from './components/InsightsList';
import ErrorBoundary from './components/ErrorBoundary';

// Create a Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <div className="theme-toggle">
      <label className="theme-toggle-switch">
        <input 
          type="checkbox" 
          checked={isDarkMode} 
          onChange={() => setIsDarkMode(!isDarkMode)} 
        />
        <span className="theme-toggle-slider"></span>
      </label>
    </div>
  );
};

function App() {
  return (
    <ConvexProvider client={convex}>
      <Router>
        <div className="app">
          <header className="app-header">
            <div className="logo">
              <h1>Architecture Insight System</h1>
            </div>
            <nav className="main-nav">
              <Link to="/">Dashboard</Link>
              <Link to="/adrs">Decisions</Link>
              <Link to="/insights">Insights</Link>
              <Link to="/map">Knowledge Map</Link>
              <Link to="/quick-capture">Quick Capture</Link>
            </nav>
            <div style={{ marginLeft: 'auto' }}>
              <ThemeToggle />
            </div>
          </header>
          
          <main className="app-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/adrs" element={<ADRList />} />
                <Route path="/adrs/new" element={<ADRForm />} />
                <Route path="/adrs/:id" element={<ADRDetail />} />
                <Route path="/insights" element={<InsightsList />} />
                <Route path="/map" element={<ArchitectureMap />} />
                <Route path="/quick-capture" element={<QuickCaptureForm />} />
              </Routes>
            </ErrorBoundary>
          </main>
          
          <footer className="app-footer">
            <p>Architecture Insight System © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </Router>
    </ConvexProvider>
  );
}

// Dashboard component
const Dashboard: React.FC = () => {
  const adrs = useQuery(api.adrs.getAll) || [];
  const insights = useQuery(api.architectureNotes.getAll) || [];
  
  // Calculate ADR statistics
  const totalADRs = adrs.length;
  const acceptedADRs = adrs.filter(adr => adr.status === 'accepted').length;
  const proposedADRs = adrs.filter(adr => adr.status === 'proposed').length;
  
  // Get ADRs from this month
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const adrsThisMonth = adrs.filter(adr => new Date(adr.createdAt) >= startOfMonth).length;
  
  // Get recent activity (both ADRs and insights)
  const recentActivity = [
    ...adrs.map(adr => ({ 
      type: 'adr', 
      title: adr.title, 
      date: adr.createdAt, 
      id: adr._id,
      status: adr.status
    })),
    ...insights.map(insight => ({ 
      type: 'insight', 
      title: insight.title, 
      date: insight.createdAt, 
      id: insight._id 
    }))
  ]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5);
  
  // Extract common tags
  const allTags = [
    ...adrs.flatMap(adr => adr.tags),
    ...insights.flatMap(insight => insight.tags)
  ];
  
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const commonTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return (
    <div className="dashboard">
      <section className="dashboard-header">
        <h2>Architecture Dashboard</h2>
        <p>Track and manage your architecture decisions, discover patterns, and document your insights.</p>
      </section>
      
      <div className="dashboard-grid">
        <section className="quick-actions card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/quick-capture" className="action-button">
              Capture Insight
            </Link>
            <Link to="/adrs/new" className="action-button">
              New Decision Record
            </Link>
            <Link to="/insights" className="action-button">
              View Insights
            </Link>
            <Link to="/map" className="action-button">
              View Knowledge Map
            </Link>
          </div>
        </section>
        
        <section className="adr-stats card">
          <h3>Decision Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{totalADRs}</span>
              <span className="stat-label">Total Decisions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{acceptedADRs}</span>
              <span className="stat-label">Accepted</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{proposedADRs}</span>
              <span className="stat-label">Proposed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{adrsThisMonth}</span>
              <span className="stat-label">This Month</span>
            </div>
          </div>
        </section>
        
        <section className="recent-activity card">
          <h3>Recent Activity</h3>
          <div className="activity-timeline">
            {recentActivity.length === 0 ? (
              <p className="empty-state">No recent activity yet.</p>
            ) : (
              <ul className="activity-list">
                {recentActivity.map((activity) => (
                  <li key={`${activity.type}-${activity.id}`} className="activity-item">
                    <div className="activity-content">
                      <Link 
                        to={activity.type === 'adr' ? `/adrs/${activity.id}` : '/insights'}
                        className="activity-title"
                      >
                        {activity.title}
                      </Link>
                      <span className="activity-meta">
                        {activity.type === 'adr' ? 'ADR' : 'Insight'} - 
                        {activity.type === 'adr' && activity.status && (
                          <span className={`status-indicator status-${activity.status}`}>
                            {activity.status}
                          </span>
                        )}
                        <span className="activity-date">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        
        <section className="code-patterns card">
          <h3>Common Tags</h3>
          <div className="patterns-list">
            {commonTags.length === 0 ? (
              <p className="empty-state">No common tags yet.</p>
            ) : (
              <div className="tags-cloud">
                {commonTags.map(([tag, count]) => (
                  <div key={tag} className="tag-item">
                    <span className="tag">{tag}</span>
                    <span className="tag-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;