import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('https://wasteguideai-backend.onrender.com/api/history');
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  // Compute stats
  const totalScans = history.length;
  const categories = history.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const recyclableCount = (categories['Recyclable'] || 0) + (categories['Plastic Waste'] || 0);
  const hazardousCount = (categories['Hazardous Waste'] || 0) + (categories['Hazardous'] || 0);
  const recycleRate = totalScans > 0 ? Math.round((recyclableCount / totalScans) * 100) : 0;

  // Chart Data
  const doughnutData = {
    labels: ['Recyclable', 'Non-Recyclable'],
    datasets: [
      {
        data: [recyclableCount, totalScans - recyclableCount],
        backgroundColor: ['#3b82f6', '#e2e8f0'],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: Object.keys(categories),
    datasets: [
      {
        label: 'Items by Category',
        data: Object.values(categories),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: 'var(--text-main)' }}>Your Impact Dashboard</h2>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Total Scans</div>
          <div className="stat-value">{totalScans}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Recyclable Items</div>
          <div className="stat-value">{recyclableCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Recycle Rate</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{recycleRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Hazardous Handled</div>
          <div className="stat-value" style={{ color: 'var(--cat-hazardous)' }}>{hazardousCount}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Waste Breakdown</h3>
          <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Categories Over Time (All Time)</h3>
          <div style={{ height: '250px' }}>
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
