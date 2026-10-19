// [1, 2, 3] -> "?,?,?"  (for WHERE id IN (...))
function placeholders(list) {
  return list.map(() => '?').join(',');
}

module.exports = { placeholders };
