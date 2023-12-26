const express = require('express');
const app = express();
const dotenv = require('dotenv');

const dbConnect = require('./config/database');

const authRouter = require('./routes/authRoute');
const messengerRouter = require('./routes/messengerRoute');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

dotenv.config({
  path: 'backend/config/config.env',
});

const PORT = process.env.PORT || 3001;
app.get('/', (req, res) => {
  res.send('This is from backend');
});

dbConnect();

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/messenger', authRouter);
app.use('/api/messenger', messengerRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
