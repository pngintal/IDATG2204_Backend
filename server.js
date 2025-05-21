const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/carts', require('./routes/carts'));
app.use('/api/cartitems', require('./routes/cartitems'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/orderitems', require('./routes/orderitems'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/postcodes', require('./routes/postcodes'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
 
