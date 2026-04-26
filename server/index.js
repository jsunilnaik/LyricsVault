// ── DNS Override (must be FIRST) ──────────────────────────────────────────────
// Forces Node.js to use Google DNS (8.8.8.8 / 8.8.4.4) so that MongoDB Atlas
// SRV records resolve correctly even when the system/ISP DNS fails.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env' });

const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);

app.get('/', (req, res) => {
    res.send('LyricVault API is running...');
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env — server cannot start.');
    process.exit(1);
}

const connectWithRetry = (retries = 5, delay = 3000) => {
    mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,  // fail fast if Atlas unreachable
        socketTimeoutMS: 45000,
        family: 4,                         // force IPv4 (avoids IPv6 SRV issues)
    })
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error(`❌ Database connection error (attempt ${6 - retries}/5):`, err.message);
        if (retries > 1) {
            console.log(`🔄 Retrying in ${delay / 1000}s...`);
            setTimeout(() => connectWithRetry(retries - 1, delay), delay);
        } else {
            console.error('💀 All connection attempts failed. Exiting.');
            process.exit(1);
        }
    });
};

connectWithRetry();
