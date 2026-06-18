const { Admin } = require('../models');

async function generateShortId() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const shortId = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await Admin.findOne({ where: { short_id: shortId } });
    if (!existing) return shortId;
  }
  throw new Error('Unable to generate unique short ID');
}

module.exports = { generateShortId };
