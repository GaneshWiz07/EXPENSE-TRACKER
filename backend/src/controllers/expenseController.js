import Expense from '../models/Expense.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Utility function to format Indian Rupee
const formatIndianRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Get expenses with advanced filtering
const getExpenses = async (req, res) => {
  try {
    const { 
      category, 
      minAmount, 
      maxAmount, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 100 
    } = req.query;

    // Build filter object
    const filter = {};

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Amount range filter
    if (minAmount && maxAmount) {
      filter.amount = { 
        $gte: parseFloat(minAmount), 
        $lte: parseFloat(maxAmount) 
      };
    } else if (minAmount) {
      filter.amount = { $gte: parseFloat(minAmount) };
    } else if (maxAmount) {
      filter.amount = { $lte: parseFloat(maxAmount) };
    }

    // Date range filter
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    // Pagination
    const options = {
      skip: (page - 1) * limit,
      limit: parseInt(limit),
      sort: { date: -1 } // Sort by most recent first
    };

    // Fetch expenses
    const expenses = await Expense.find(filter, null, options);
    const totalExpenses = await Expense.countDocuments(filter);

    // Send response
    res.status(200).json({
      success: true,
      count: expenses.length,
      total: totalExpenses,
      page: parseInt(page),
      data: expenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message 
    });
  }
};

// Generate monthly report with filtering
const generateMonthlyReport = async (req, res, skipFetch = false) => {
  try {
    const { 
      category, 
      subcategory, 
      paymentMethod, 
      minAmount, 
      maxAmount 
    } = req.query;

    // Build filter object dynamically
    const filter = {};
    
    // Category filter
    if (category) filter.category = category;
    
    // Subcategory filter
    if (subcategory) filter.subcategory = subcategory;
    
    // Payment method filter
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    // Amount range filter with precise handling
    if (minAmount && maxAmount) {
      // Both min and max specified
      filter.amount = { 
        $gte: parseFloat(minAmount), 
        $lte: parseFloat(maxAmount) 
      };
    } else if (minAmount) {
      // Only minimum amount specified
      filter.amount = { $gte: parseFloat(minAmount) };
    } else if (maxAmount) {
      // Only maximum amount specified
      filter.amount = { $lte: parseFloat(maxAmount) };
    }

    // Fetch expenses with applied filters
    const expenses = skipFetch ? await Expense.find(filter) : await Expense.find(filter);

    // Calculate total expenses and category breakdown
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    // Prepare top categories
    const topCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name, 
        amount, 
        percentage: ((amount / totalExpenses) * 100).toFixed(2)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // Fallback AI insights generation
    const healthAssessment = generateHealthAssessment(topCategories, totalExpenses);
    const recommendations = generateRecommendations(topCategories);

    return {
      healthAssessment,
      topCategories: topCategories.map(c => ({
        name: c.name,
        percentage: c.percentage
      })),
      recommendations
    };
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'Failed to generate monthly report', error: error.message });
  }
};

// Fallback health assessment generator
const generateHealthAssessment = (topCategories, totalExpenses) => {
  if (topCategories.length === 0) {
    return " No expenses recorded this month. Consider tracking your spending more closely.";
  }

  const topCategory = topCategories[0];
  const concentrationRisk = topCategory.percentage > 50 
    ? " High concentration of expenses in a single category!" 
    : " Expenses are relatively balanced across categories.";

  const totalExpensesAssessment = totalExpenses < 30000 
    ? " Low monthly spending" 
    : totalExpenses > 150000 
      ? " High monthly spending" 
      : " Moderate monthly spending";

  return `${concentrationRisk} ${totalExpensesAssessment} at ${formatIndianRupee(totalExpenses)}.  The top category (${topCategory.name}) accounts for ${topCategory.percentage}% of your total expenses.`;
};

// Fallback recommendations generator
const generateRecommendations = (topCategories) => {
  if (topCategories.length === 0) {
    return [
      " Start tracking your expenses systematically",
      " Create a basic budget to understand your spending patterns",
      " Consider using budgeting apps or spreadsheets"
    ];
  }

  const topCategory = topCategories[0];
  const recommendations = [
    ` Review your ${topCategory.name} expenses in detail`,
    " Create a budget that allocates funds across different categories",
    " Look for ways to reduce spending in your top expense category",
    " Build an emergency fund to provide financial security",
    " Track your expenses consistently to gain better financial insights"
  ];

  return recommendations;
};

// Helper function to parse AI insights into structured format
const parseAIInsights = (aiText) => {
  const healthAssessmentMatch = aiText.match(/Financial Health Assessment:(.*?)(?=Top Spending Categories:|\n\n|$)/s);
  const topCategoriesMatch = aiText.match(/Top Spending Categories:(.*?)(?=Budgeting Recommendations:|\n\n|$)/s);
  const recommendationsMatch = aiText.match(/Budgeting Recommendations:(.*)/s);

  return {
    healthAssessment: healthAssessmentMatch 
      ? healthAssessmentMatch[1].trim() 
      : 'Unable to generate financial health assessment.',
    recommendations: recommendationsMatch 
      ? recommendationsMatch[1].trim().split('\n').map(rec => rec.replace(/^[*-]\s*/, '').trim()).filter(rec => rec)
      : ['No specific recommendations available.']
  };
};

// Create expense with AI insights
const createExpense = async (req, res) => {
  try {
    console.log('Create Expense Request Body:', req.body);
    console.log('Request Headers:', req.headers);
    
    const { description, amount, category, tags, subcategory, paymentMethod } = req.body;

    // Validate required fields
    if (!description || !amount || !category || !paymentMethod) {
      console.error('Missing required fields:', { description, amount, category, paymentMethod });
      return res.status(400).json({ 
        message: 'Missing required fields. Please provide description, amount, category, and payment method.' 
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ 
        message: 'Invalid amount. Amount must be a positive number.' 
      });
    }

    // Create new expense
    const newExpense = new Expense({
      description,
      amount,
      category,
      subcategory: subcategory || 'General',
      tags: tags || [],
      paymentMethod
    });

    // Generate AI insights
    try {
      const aiInsights = await generateAIInsights(description, amount, category);
      newExpense.aiInsights = aiInsights;
    } catch (aiError) {
      console.warn('AI insights generation failed:', aiError);
      // Continue saving expense even if AI insights fail
    }

    // Save expense
    try {
      await newExpense.save();
      console.log('Expense saved successfully:', newExpense);

      res.status(201).json({
        message: 'Expense added successfully',
        expense: newExpense,
        aiInsights: newExpense.aiInsights
      });
    } catch (saveError) {
      console.error('Error saving expense:', saveError);
      res.status(500).json({ 
        message: 'Failed to save expense',
        error: saveError.message 
      });
    }
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ 
      message: 'Failed to create expense',
      error: error.message 
    });
  }
};

// Get all expenses
const getAllExpenses = async (req, res) => {
  try {
    console.log('Fetching all expenses');
    const expenses = await Expense.find();
    console.log(`Found ${expenses.length} expenses`);
    res.json(expenses);
  } catch (error) {
    console.error('Get Expenses Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete an expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Expense ID is required' 
      });
    }

    // Validate ID format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid expense ID format' 
      });
    }

    // Find and delete the expense
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ 
        success: false,
        message: 'Expense not found',
      });
    }

    // Recalculate monthly report after deletion
    const monthlyReport = await generateMonthlyReport(req, res, true);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      deletedExpense,
      monthlyReport
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete expense',
      error: error.message 
    });
  }
};

// Restore dashboard data function
const getDashboardData = async (req, res) => {
  try {
    // Calculate total expenses
    const totalExpenses = await Expense.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate monthly expenses (current month)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: '$date' }, currentMonth] },
              { $eq: [{ $year: '$date' }, currentYear] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Category Breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Recent Expenses (last 5)
    const recentExpenses = await Expense.find()
      .sort({ date: -1 })
      .limit(5);

    // Prepare response
    res.status(200).json({
      totalExpenses: totalExpenses[0]?.total || 0,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      categoryBreakdown: categoryBreakdown.reduce((acc, category) => {
        acc[category._id] = category.total;
        return acc;
      }, {}),
      recentExpenses: recentExpenses
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve dashboard data',
      error: error.message 
    });
  }
};

// Generate AI insights for expense
async function generateAIInsights(description, amount, category) {
  try {
    console.log('Generating AI Insights');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this expense: 
    Description: ${description}
    Amount: $${amount}
    Category: ${category}
    
    Provide:
    1. A sentiment analysis (positive/neutral/negative)
    2. A brief financial recommendation

    Format your response as:
    Sentiment: [sentiment]
    Recommendation: [recommendation]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const lines = text.split('\n');
    return {
      sentiment: lines[0].replace('Sentiment: ', '').trim(),
      recommendation: lines[1].replace('Recommendation: ', '').trim()
    };
  } catch (error) {
    console.error('AI Insights Generation Error:', error);
    return {
      sentiment: 'neutral',
      recommendation: 'No specific insights available.'
    };
  }
}

// Update an existing expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expense ID is required' 
      });
    }

    // Optional: Add validation for update data
    const allowedFields = [
      'description', 
      'amount', 
      'category', 
      'date', 
      'paymentMethod', 
      'notes', 
      'tags'
    ];

    const validUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        validUpdateData[key] = updateData[key];
      }
    });

    // Perform update
    const updatedExpense = await Expense.findByIdAndUpdate(
      id, 
      validUpdateData, 
      { 
        new: true,  // Return the updated document
        runValidators: true  // Run model validation on update
      }
    );

    // Check if expense was found and updated
    if (!updatedExpense) {
      return res.status(404).json({ 
        success: false, 
        message: 'Expense not found' 
      });
    }

    // Generate AI insights for the updated expense
    const aiInsights = await generateAIInsights(
      updatedExpense.description, 
      updatedExpense.amount, 
      updatedExpense.category
    );

    // Attach AI insights to the response
    updatedExpense.aiInsights = aiInsights;

    // Send successful response
    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update expense',
      error: error.message 
    });
  }
};

// Export all functions as a single object
export default {
  createExpense,
  getExpenses,
  getAllExpenses,
  deleteExpense,
  generateMonthlyReport,
  generateAIInsights,
  getDashboardData,
  updateExpense
};
