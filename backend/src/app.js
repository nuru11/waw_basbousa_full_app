const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const dishRoutes = require('./routes/dishRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const stockRoutes = require('./routes/stockRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const transferRoutes = require('./routes/transferRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const chiefExpenseRoutes = require('./routes/chiefExpenseRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const tipRoutes = require('./routes/tipRoutes');
const coffeeRoutes = require('./routes/coffeeRoutes');
const waterRoutes = require('./routes/waterRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Restaurant API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/chief-expenses', chiefExpenseRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/coffee', coffeeRoutes);
app.use('/api/water', waterRoutes);

app.use(errorHandler);

module.exports = app;
