import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ExpenseForm.css';
import { api } from '../utils/api';

const ExpenseForm = () => {
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: '',
    description: '',
    date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/expenses', expenseData);
      console.log('Expense created:', response.data);
      // Reset form
      setExpenseData({
        amount: '',
        category: '',
        description: '',
        date: ''
      });
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};

export default ExpenseForm;
