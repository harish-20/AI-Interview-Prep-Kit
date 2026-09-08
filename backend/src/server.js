const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`[AI Interview Prep Kit] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
