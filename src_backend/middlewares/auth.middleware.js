export function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.admin) {
      return next();
    } else {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để truy cập tài nguyên này' });
    }
  }
  