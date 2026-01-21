require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'secret_key_change_me',
    // Usuarios harcodeados para prototipo. En producción usar DB.
    USERS: [
        { username: 'admin', password: 'password123' }
    ]
};
