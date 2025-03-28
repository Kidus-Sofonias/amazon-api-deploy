const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios"); // Add this line
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

app.get("/api/search", async (req, res) => {
  const query = req.query.query;

  if (!query || query.trim() === "") {
    console.log("Search query is missing or empty.");
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    // Fetch data from fakestoreapi
    const response = await axios.get("https://fakestoreapi.com/products");
    const products = response.data;

    // Log the query and fetched products for debugging
    console.log("Search query:", query);
    console.log("Fetched products:", products);

    // Mock category data for demonstration
    const categories = [
      { id: "electronics", name: "Electronics", type: "category" },
      { id: "jewelery", name: "Jewelery", type: "category" },
      { id: "mens-category", name: "Men's Category", type: "category" },
      { id: "womens-category", name: "Women's Category", type: "category" },
    ];

    // Filter products based on the query (case-insensitive)
    const productResults = products
      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
      .map((product) => ({
        id: product.id,
        name: product.title,
        type: "product",
      }));

    // Filter categories based on the query (case-insensitive)
    const categoryResults = categories
      .filter((category) =>
        category.name.toLowerCase().includes(query.toLowerCase())
      )
      .map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type, // Ensure type is included
      }));

    // Combine results
    const results = [...categoryResults, ...productResults];

    // Log the filtered results for debugging
    console.log("Filtered search results:", results);

    // If no results are found, return an empty array with a 200 status
    if (results.length === 0) {
      console.log("No results found for the query.");
      return res.status(200).json([]);
    }

    // Return results
    res.status(200).json(results);
  } catch (error) {
    console.error("Error during search:", error.message);
    res.status(500).json({ error: "An error occurred while searching" });
  }
});

app.post("/payment/create", async (req, res) => {
  const total = parseInt(req.query.total, 10);

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
