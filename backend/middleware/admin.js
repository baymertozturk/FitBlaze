/**
 * Admin middleware — Admin paneli herkese açık, kullanıcı girişinden bağımsız çalışır.
 * Herhangi bir token/login kontrolü yapmaz.
 */
const adminOnly = (req, res, next) => {
  next()
}

module.exports = { adminOnly }
