const express = require("express");
const { isLoggedIn } = require("../middleware");
const User = require("../models/User");
const Product = require("../models/product");
const router = express.Router();
const stripe = require("stripe")("sk_test_tR3PYbcVNZZ796tH88S4VQ2u");

router.get("/user/cart", isLoggedIn, async (req, res) => {
  let userId = req.user._id;
  let user = await User.findById(userId).populate("cart");
  //   console.log(user, "sam");
  let totalAmount = user.cart.reduce((sum, curr) => sum + curr.price, 0);
  //   console.log(totalAmount);

  res.render("cart/cart", { user, totalAmount });
});

router.post("/user/:productId/add", isLoggedIn, async (req, res) => {
  let { productId } = req.params;
  let userId = req.user._id;
  let user = await User.findById(userId);
  //   console.log(user, "sam");
  let product = await Product.findById(productId);
  user.cart.push(product);
  await user.save();
  res.redirect("/user/cart");
});
router.get("/product/payment", async (req, res) => {
  let user = req.user;
  let products = await User.findById({ _id: user._id }).populate("cart");
  console.log(products.cart);
  const session = await stripe.checkout.sessions.create({
    line_items: Array.from(products.cart).map((item) => {
      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${item.name}`,
          },
          unit_amount: item.price * 100,
        },
        quantity: 1,
      };
    }),

    mode: "payment",
    success_url: "http://localhost:4242/success",
    cancel_url: "http://localhost:4242/cancel",
  });

  res.redirect(303, session.url);
});
module.exports = router;
