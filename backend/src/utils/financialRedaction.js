const PURCHASE_FINANCIAL_FIELDS = ['unit_price', 'total_price', 'screenshot_path'];
const DISH_PRICE_FIELDS = ['price_quarter', 'price_half', 'price_kilo', 'price_per_slice', 'price_half_slice'];

function toPlainObject(record) {
  return typeof record?.toJSON === 'function' ? record.toJSON() : { ...record };
}

function redactFields(record, fields) {
  const json = toPlainObject(record);
  for (const field of fields) {
    delete json[field];
  }
  return json;
}

function redactPurchase(purchase) {
  return redactFields(purchase, PURCHASE_FINANCIAL_FIELDS);
}

function redactPurchases(purchases) {
  return purchases.map(redactPurchase);
}

function redactDish(dish) {
  return redactFields(dish, DISH_PRICE_FIELDS);
}

function redactDishes(dishes) {
  return dishes.map(redactDish);
}

module.exports = {
  redactPurchase,
  redactPurchases,
  redactDish,
  redactDishes,
};
