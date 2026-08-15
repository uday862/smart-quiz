const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token required' });
        }

        const token = authHeader.split(' ')[1];
        const JWT_SECRET = process.env.JWT_SECRET || 'smartquiz_secret_key_2026';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.requireAdmin = (req, res, next) => {
    exports.requireAuth(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied: Admin privileges required' });
        }
    });
};
