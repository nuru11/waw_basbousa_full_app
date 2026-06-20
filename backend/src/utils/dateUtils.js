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

function getYesterdayRange() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateRange(formatDateYmd(yesterday));
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffToMonday);
  return start;
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function getStartOfQuarter() {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
}

module.exports = {
  getTodayRange,
  getYesterdayRange,
  getDateRange,
  formatDateYmd,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfQuarter,
};
