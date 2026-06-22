const PAYMENT_METHODS = [
  'cash',
  'cbe',
  'telebirr',
  'awash',
  'dashen',
  'abyssinia',
  'nib',
  'coop',
  'other',
];

function createEmptyPayments() {
  return Object.fromEntries(PAYMENT_METHODS.map((method) => [method, 0]));
}

module.exports = {
  PAYMENT_METHODS,
  createEmptyPayments,
};
