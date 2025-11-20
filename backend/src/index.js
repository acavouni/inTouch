const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', userRoutes);
app.use('/friends', friendRoutes);
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
