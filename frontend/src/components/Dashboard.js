import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../contexts/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/Dashboard.css';
import { api } from '../utils/api';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    categoryBreakdown: {},
    recentExpenses: [],
    monthlyChange: 0,
    expenseCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await currentUser.getIdToken();
      const response = await axios.get('http://localhost:5000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Dashboard response:', response.data);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const handleRetry = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>😕 Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          RETRY LOADING
        </button>
      </div>
    );
  }

  // Prepare data for pie chart
  const pieChartData = {
    labels: Object.keys(dashboardData.categoryBreakdown),
    datasets: [{
      data: Object.values(dashboardData.categoryBreakdown),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ]
    }]
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Financial Overview</h2>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <p>{formatCurrency(dashboardData.totalExpenses, 'INR')}</p>
        </div>
        <div className="stat-card">
          <h3>Monthly Expenses</h3>
          <p>{formatCurrency(dashboardData.monthlyExpenses, 'INR')}</p>
          <small className={dashboardData.monthlyChange >= 0 ? 'positive' : 'negative'}>
            {dashboardData.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.monthlyChange).toFixed(1)}% from last month
          </small>
        </div>
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p>{dashboardData.expenseCount}</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Expense Categories</h3>
          {Object.keys(dashboardData.categoryBreakdown).length > 0 ? (
            <Pie data={pieChartData} options={{ responsive: true }} />
          ) : (
            <p className="no-data">No expense data available</p>
          )}
        </div>
      </div>

      <div className="recent-expenses">
        <h3>Recent Expenses</h3>
        <div className="expense-list">
          {dashboardData.recentExpenses.length > 0 ? (
            dashboardData.recentExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <h4>{expense.description}</h4>
                  <p>{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div className="expense-amount">
                  {formatCurrency(expense.amount, 'INR')}
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No recent expenses</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
