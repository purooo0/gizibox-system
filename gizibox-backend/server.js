// server.js
import express from 'express';
import cors from 'cors';
import authRoutes from './api/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('🚀 GiziBox API is running!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- POST   /api/auth/register`);
  console.log(`- POST   /api/auth/login`);
  console.log(`- POST   /api/auth/logout`);
  console.log(`- GET    /api/auth/me`);
});

export default app;
