function formatDateYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateRange(dateInput) {
  let base;
  if (dateInput) {
    const [y, m, d] = String(dateInput).split('-').map(Number);
    if (!y || !m || !d) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    base = new Date(y, m - 1, d);
  } else {
    base = new Date();
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);

  return { start, end, date: formatDateYmd(start) };
}

function getTodayRange() {
  return getDateRange();
}

module.exports = { getTodayRange, getDateRange, formatDateYmd };
