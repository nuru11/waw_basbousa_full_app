'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const Admin = require('./Admin')(sequelize);
const Ingredient = require('./Ingredient')(sequelize);
const Dish = require('./Dish')(sequelize);
const Purchase = require('./Purchase')(sequelize);
const DishIngredient = require('./DishIngredient')(sequelize);
const ProductionLog = require('./ProductionLog')(sequelize);
const Sale = require('./Sale')(sequelize);
const StockMovement = require('./StockMovement')(sequelize);
const Transfer = require('./Transfer')(sequelize);
const Expense = require('./Expense')(sequelize);
const SalaryPayment = require('./SalaryPayment')(sequelize);
const PosDefaultPrice = require('./PosDefaultPrice')(sequelize);
const ChiefExpense = require('./ChiefExpense')(sequelize);

Admin.hasMany(Purchase, { foreignKey: 'purchaser_id', as: 'purchasesMade' });
Purchase.belongsTo(Admin, { foreignKey: 'purchaser_id', as: 'purchaser' });

Admin.hasMany(Purchase, { foreignKey: 'chief_id', as: 'purchasesReceived' });
Purchase.belongsTo(Admin, { foreignKey: 'chief_id', as: 'chief' });

Admin.hasMany(Purchase, { foreignKey: 'approved_by', as: 'purchasesApproved' });
Purchase.belongsTo(Admin, { foreignKey: 'approved_by', as: 'approver' });

Ingredient.hasMany(Purchase, { foreignKey: 'ingredient_id', as: 'purchases' });
Purchase.belongsTo(Ingredient, { foreignKey: 'ingredient_id', as: 'ingredient' });

Dish.belongsToMany(Ingredient, {
  through: DishIngredient,
  foreignKey: 'dish_id',
  otherKey: 'ingredient_id',
  as: 'ingredients',
});
Ingredient.belongsToMany(Dish, {
  through: DishIngredient,
  foreignKey: 'ingredient_id',
  otherKey: 'dish_id',
  as: 'dishes',
});
Dish.hasMany(DishIngredient, { foreignKey: 'dish_id', as: 'recipe' });
DishIngredient.belongsTo(Dish, { foreignKey: 'dish_id' });
DishIngredient.belongsTo(Ingredient, { foreignKey: 'ingredient_id', as: 'ingredient' });

Dish.hasMany(ProductionLog, { foreignKey: 'dish_id', as: 'productionLogs' });
ProductionLog.belongsTo(Dish, { foreignKey: 'dish_id', as: 'dish' });
ProductionLog.belongsTo(Admin, { foreignKey: 'chief_id', as: 'chief' });

Dish.hasMany(Sale, { foreignKey: 'dish_id', as: 'sales' });
Sale.belongsTo(Dish, { foreignKey: 'dish_id', as: 'dish' });
Sale.belongsTo(Admin, { foreignKey: 'seller_id', as: 'seller' });
Admin.hasMany(Sale, { foreignKey: 'seller_id', as: 'sales' });

Ingredient.hasMany(StockMovement, { foreignKey: 'ingredient_id', as: 'movements' });
StockMovement.belongsTo(Ingredient, { foreignKey: 'ingredient_id', as: 'ingredient' });
StockMovement.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

Admin.hasMany(Transfer, { foreignKey: 'purchaser_id', as: 'transfersReceived' });
Transfer.belongsTo(Admin, { foreignKey: 'purchaser_id', as: 'purchaser' });
Admin.hasMany(Transfer, { foreignKey: 'created_by', as: 'transfersCreated' });
Transfer.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

Admin.hasMany(Expense, { foreignKey: 'created_by', as: 'expensesCreated' });
Expense.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

Admin.hasMany(SalaryPayment, { foreignKey: 'employee_id', as: 'salaryPayments' });
SalaryPayment.belongsTo(Admin, { foreignKey: 'employee_id', as: 'employee' });
Admin.hasMany(SalaryPayment, { foreignKey: 'paid_by', as: 'salaryPaymentsMade' });
SalaryPayment.belongsTo(Admin, { foreignKey: 'paid_by', as: 'payer' });
Expense.hasOne(SalaryPayment, { foreignKey: 'expense_id', as: 'salaryPayment' });
SalaryPayment.belongsTo(Expense, { foreignKey: 'expense_id', as: 'expense' });

Admin.hasMany(ChiefExpense, { foreignKey: 'chief_id', as: 'chiefExpensesReceived' });
ChiefExpense.belongsTo(Admin, { foreignKey: 'chief_id', as: 'chief' });
Admin.hasMany(ChiefExpense, { foreignKey: 'created_by', as: 'chiefExpensesCreated' });
ChiefExpense.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  sequelize,
  Sequelize,
  Admin,
  Ingredient,
  Dish,
  Purchase,
  DishIngredient,
  ProductionLog,
  Sale,
  StockMovement,
  Transfer,
  Expense,
  SalaryPayment,
  PosDefaultPrice,
  ChiefExpense,
};
