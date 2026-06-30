import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Leaf, Map as MapIcon, BarChart2, ScanLine, Sun, Moon, Cloud } from 'lucide-react';
import Scanner from './components/Scanner';
import MapView from './components/Map';
import Dashboard from './components/Dashboard';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [stats, setStats] = useState({ total: 0, categories: [] });
  const [fact, setFact] = useState("Recycling a single aluminum can saves enough energy to power a TV for 3 hours.");

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const facts = [
      "Recycling a single aluminum can saves enough energy to power a TV for 3 hours.",
      "Glass can be recycled endlessly without loss in quality or purity.",
      "Over 1 million seabirds and 100,000 sea mammals are killed by pollution every year.",
      "Recycling one ton of paper saves 17 trees and 7,000 gallons of water.",
      "E-waste represents 2% of America's trash in landfills, but it equals 70% of overall toxic waste."
    ];
    setFact(facts[Math.floor(Math.random() * facts.length)]);

    const fetchStats = async () => {
      try {
        const res = await axios.get('https://wasteguideai-backend.onrender.com/api/history');
        const history = res.data;
        const total = history.length;
        
        const counts = {};
        history.forEach(item => {
          const cat = item.category || 'General Waste';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        
        const categories = Object.keys(counts).map(cat => ({
          name: cat,
          percentage: total > 0 ? Math.round((counts[cat] / total) * 100) : 0
        })).sort((a, b) => b.percentage - a.percentage).slice(0, 4);

        setStats({ total, categories });
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <Router>
      <div className="ambient-orbs">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
      </div>
      <div className="app-container">
        <div className="nav-wrapper">
          <nav className="floating-nav">
            <div className="nav-brand">
              <Leaf size={36} />
              <span>WasteGuide AI</span>
            </div>
            <div className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                <ScanLine size={18} /> Scanner
              </span>
            </NavLink>
            <NavLink to="/map" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                <MapIcon size={18} /> Map
              </span>
            </NavLink>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                <BarChart2 size={18} /> Dashboard
              </span>
            </NavLink>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Dark Mode">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            </div>
          </nav>
        </div>

        <div className="app-body">
          <aside className="sidebar left-sidebar">
            <div className="sidebar-widget">
              <h4><Leaf size={16} /> Did You Know?</h4>
              <p>{fact}</p>
            </div>
            <div className="sidebar-widget">
              <h4><MapIcon size={16} /> Local Guidelines</h4>
              <ul className="sidebar-list">
                <li>Rinse all plastic containers before recycling.</li>
                <li>Remove caps and lids from glass bottles.</li>
                <li>Do not bag your recyclables.</li>
              </ul>
            </div>
          </aside>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Scanner />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>

          <aside className="sidebar right-sidebar">
            <div className="sidebar-widget highlight-widget" style={{ background: 'var(--grad-organic)' }}>
              <h4><Cloud size={16} /> Carbon Offset</h4>
              <div className="impact-stat">
                <span className="impact-number">{(stats.total * 1.4).toFixed(1)} <span style={{fontSize: '1.2rem'}}>kg</span></span>
                <span className="impact-label">Estimated CO₂ Emissions Prevented</span>
              </div>
            </div>
            <div className="sidebar-widget">
              <h4><BarChart2 size={16} /> Top Categories</h4>
              {stats.categories.length > 0 ? (
                <ul className="sidebar-list stats-list">
                  {stats.categories.map((cat, i) => (
                    <li key={i}><span>{cat.name}</span> <span>{cat.percentage}%</span></li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scan an item to generate community statistics.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Router>
  );
}

export default App;
