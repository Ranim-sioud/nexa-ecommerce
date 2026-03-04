import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 4001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} - listening on all interfaces`);
});