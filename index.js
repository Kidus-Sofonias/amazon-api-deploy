const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.STRIPE_KEY) {
  throw new Error("STRIPE_KEY is not defined in the environment variables");
}

const stripe = require("stripe")(process.env.STRIPE_KEY);
const app = express();
app.use(cors({ origin: true }));

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Success !",
  });
});

app.post("/payment/create", async (req, res) => {
  const total = parseInt(req.query.total);

  // Check if the total amount is at least 50 cents
  if (total < 50) {
    return res.status(400).send({
      error: "Amount must be at least $0.50 USD",
    });
  }

  if (total > 0) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
      });

      res.status(201).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      res.status(500).send({
        error: error.message,
      });
    }
  } else {
    res.status(403).json({
      message: "Total must be greater than 0",
    });
  }
});

app.listen(5000, (err) => {
  if (err) throw err;
  console.log("Amazon server running at PORT: 5000, http://localhost:5000");
});
