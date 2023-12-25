const express = require('express');
const app = express();
const dotenv = require('dotenv');

const dbConnect = require('./config/database');

dotenv.config({
  path: 'backend/config/config.env',
});

const PORT = process.env.PORT || 3001;
app.get('/', (req, res) => {
  res.send('This is from backend');
});

dbConnect();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
