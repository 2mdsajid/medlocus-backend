
const mongoose = require("mongoose");


const payment = new mongoose.Schema({
  transactionID: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value > 0;
      },
      message: "Amount must be a positive number",
    },
  },
  expiryDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
});

const Payment = mongoose.model("payment", payment);

module.exports = Payment;
