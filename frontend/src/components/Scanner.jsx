import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertTriangle, CheckCircle, Info, Lightbulb, Loader2, Leaf, Recycle, Star, Zap, MapPin, BarChart3, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Scanner = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (result && result.category) {
      let cat = result.category.toLowerCase();
      if (cat.includes('hazardous')) document.body.setAttribute('data-category', 'hazardous');
      else if (cat.includes('organic')) document.body.setAttribute('data-category', 'organic');
      else if (cat.includes('e-waste') || cat.includes('electronic')) document.body.setAttribute('data-category', 'ewaste');
      else if (cat.includes('plastic') || cat.includes('recyclable')) document.body.setAttribute('data-category', 'recyclable');
      else document.body.setAttribute('data-category', 'general');
    } else {
      document.body.removeAttribute('data-category');
    }

    return () => document.body.removeAttribute('data-category');
  }, [result]);

  const handleScan = async (e, directQuery = null) => {
    if (e) e.preventDefault();
    
    const searchQuery = directQuery || query;
    if (!searchQuery.trim()) return;

    if (directQuery) {
      setQuery(directQuery);
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/api/scan', { item: searchQuery });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the item. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <h1 className="scanner-title">What would you like to dispose of?</h1>
      <p className="scanner-subtitle">Enter an item to get instant AI-powered disposal instructions.</p>
      
      <form onSubmit={handleScan} className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="e.g. plastic bottle, old battery, pizza box..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          <span>Scan</span>
        </button>
      </form>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '5rem', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: '1.5rem', animation: 'float 2s infinite ease-in-out' }}>
            <Leaf size={64} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Identifying material...</h2>
          <p>Consulting our eco-database for the best disposal method.</p>
        </div>
      )}

      {!result && !loading && (
        <div className="empty-state-content">
          <div className="popular-items">
            <h3>Try Scanning</h3>
            <div className="popular-grid">
              {['Pizza Box', 'AA Battery', 'Coffee Cup', 'Smartphone', 'Plastic Bag'].map(item => (
                <button key={item} className="popular-chip" onClick={() => {
                  handleScan(null, item);
                }}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card clickable" onClick={() => document.querySelector('.search-input').focus()}>
              <div className="feature-icon"><Zap size={24} /></div>
              <h4>Instant AI Analysis</h4>
              <p>Powered by Llama 3.3, instantly classify and break down the composition of your waste.</p>
            </div>
            <div className="feature-card clickable" onClick={() => navigate('/map')}>
              <div className="feature-icon"><MapPin size={24} /></div>
              <h4>Smart Routing</h4>
              <p>Find the exact specialized collection centers near you for e-waste and hazardous materials.</p>
            </div>
            <div className="feature-card clickable" onClick={() => navigate('/dashboard')}>
              <div className="feature-icon"><BarChart3 size={24} /></div>
              <h4>Personal Analytics</h4>
              <p>Track your recycling rate over time and measure your personal environmental impact.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginBottom: '2rem' }}>{error}</div>
      )}

      {result && (
        <div className="result-card">
          <div className={`category-badge ${result.category.toLowerCase().replace(' ', '-')}`}>
            {result.category}
          </div>

          {result.hazard_warning && (
            <div className="warning-box">
              <AlertTriangle className="warning-icon" />
              <div>
                <strong>Hazard Warning:</strong> {result.hazard_warning}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h3 className="section-title"><CheckCircle size={20} color="var(--primary)" /> Disposal Instructions</h3>
            <ul className="instructions-list">
              {result.instructions.map((inst, idx) => (
                <li key={idx}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{idx + 1}.</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {result.eco_suggestion && (
            <div className="eco-suggestion">
              <Lightbulb size={24} />
              <div>
                <strong>Eco Tip:</strong> {result.eco_suggestion}
              </div>
            </div>
          )}

          <div className="tile-grid">
            {result.explanation && (
              <div className="info-tile">
                <h4><Info size={16} /> Environmental Impact</h4>
                <p>{result.explanation}</p>
              </div>
            )}
            {result.upcycling_ideas && result.upcycling_ideas.length > 0 && (
              <div className="info-tile">
                <h4><Star size={16} /> Upcycling Ideas</h4>
                <ul className="upcycling-list">
                  {result.upcycling_ideas.map((idea, i) => <li key={i}>{idea}</li>)}
                </ul>
              </div>
            )}
            {result.recycling_difficulty && (
              <div className="info-tile">
                <h4><Recycle size={16} /> Recycling Difficulty</h4>
                <div className="difficulty-badge">
                  {result.recycling_difficulty}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
