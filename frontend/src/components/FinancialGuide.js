import React from 'react';

const FinancialGuide = ({ expenses, monthlyReport }) => {
  // Helper function to calculate total expenses
  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Helper function to get category-wise spending
  const getCategorySpending = () => {
    const categorySpending = {};
    expenses.forEach(expense => {
      categorySpending[expense.category] = (categorySpending[expense.category] || 0) + expense.amount;
    });
    return categorySpending;
  };

  // Generate personalized tips based on spending patterns
  const generateTips = () => {
    const total = calculateTotal();
    const categorySpending = getCategorySpending();
    const tips = [];

    // Add category-specific tips
    Object.entries(categorySpending).forEach(([category, amount]) => {
      const percentage = (amount / total) * 100;
      
      if (percentage > 30) {
        tips.push({
          type: 'warning',
          title: `High ${category} Spending`,
          description: `Your ${category} expenses account for ${percentage.toFixed(1)}% of total spending. Consider setting a budget for this category.`
        });
      }
    });

    // Add general financial tips
    if (total > 50000) {
      tips.push({
        type: 'saving',
        title: 'High Monthly Spending',
        description: 'Your monthly expenses are relatively high. Consider reviewing non-essential expenses.'
      });
    }

    // Add savings recommendation
    const savingsTip = {
      type: 'suggestion',
      title: 'Savings Opportunity',
      description: 'Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.'
    };
    tips.push(savingsTip);

    // Add budget planning tip
    const budgetTip = {
      type: 'budget',
      title: 'Budget Planning',
      description: 'Set category-wise budgets to better manage your expenses. Review them weekly.'
    };
    tips.push(budgetTip);

    return tips;
  };

  const tips = generateTips();

  return (
    <div className="financial-guide-section">
      <div className="guide-header">
        <h3>AI Financial Guide</h3>
        <p className="guide-subtitle">Personalized recommendations based on your spending patterns</p>
      </div>

      <div className="guide-cards">
        {tips.map((tip, index) => (
          <div 
            key={index} 
            className="guide-card"
            data-type={tip.type}
          >
            <div className="guide-card-icon">
              {tip.type === 'warning' && '⚠️'}
              {tip.type === 'saving' && '💰'}
              {tip.type === 'suggestion' && '💡'}
              {tip.type === 'budget' && '📊'}
            </div>
            <div className="guide-card-content">
              <h4>{tip.title}</h4>
              <p>{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialGuide;
