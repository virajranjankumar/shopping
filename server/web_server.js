const express = require('express');
const productApiManager = require('./ApiManager.js');
const formidableMiddleware = require('express-formidable');
const sessions = require("client-sessions");
const serializer = require('serialize-to-js');
const ampCors = require('amp-toolbox-cors');
const AmpOptimizer = require('amp-toolbox-optimizer');
const apiManager = new productApiManager();

/* CONSTANTS */
const ampOptimizer = AmpOptimizer.create();

/** LIST OF STATIC URLS FOR STATIC PAGES **/

const app = express();

app.use(formidableMiddleware());
app.use(sessions({
  cookieName: 'session',
  secret: 'eommercedemoofamazigness',
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5
}));

//Configure amp-toolbox-cors for CORS.
app.use(ampCors({ verifyOrigin: false }));

const port = process.env.PORT || 8080;
const listener = app.listen(port, () => {
  console.log('App listening on port ' + listener.address().port);
});

app.get('/shopping-cart', function (req, res) {

  //get related products for the cart page: items belonging to the category of the first item in the cart, excluding the item.
  let shoppingCart = req.session.shoppingCart;
  let relatedProductsObj = new Object();

  if (shoppingCart) {
    shoppingCart = serializer.deserialize(shoppingCart);
    let cartItems = shoppingCart.cartItems;
    if (cartItems.length > 0) {
      let firstCartItem = cartItems[0];
      relatedProductsObj.Main_Id = firstCartItem.productId;
      relatedProductsObj.CategoryId = firstCartItem.categoryId;
    }
  }

  // renderPage(req, res, 'cart-details', relatedProductsObj);
  res.json(relatedProductsObj);
});


/** API **/

app.post('/api/add-to-cart', function (req, res) {

  let productId = req.fields.productId;
  let categoryId = req.fields.categoryId;
  let name = req.fields.name;
  let price = req.fields.price;
  let color = req.fields.color;
  let size = req.fields.size;
  let imgUrl = req.fields.imgUrl;
  let origin = req.get('origin');
  let quantity = req.fields.quantity;
  let cannonicalUrl = 'https://' + req.get('host');
  //If comes from the cache
  if (req.headers['amp-same-origin'] !== 'true') {
    //transfrom POST into GET and redirect to same url
    let queryString = 'productId=' + productId + '&categoryId=' + categoryId + '&name=' + name + '&price=' + price + '&color=' + color + '&size=' + size + '&quantity=' + quantity + '&origin=' + origin + '&imgUrl=' + imgUrl;
    res.header("AMP-Redirect-To", cannonicalUrl + "/api/add-to-cart?" + queryString);
  } else {
    updateShoppingCartOnSession(req, productId, categoryId, name, price, color, size, imgUrl, quantity);
    res.header("AMP-Redirect-To", origin + "/shopping-cart");
  }

  //amp-form requires json response
  res.json({});
});

app.get('/api/add-to-cart', function (req, res) {
  const {
    productId,
    categoryId,
    name,
    price,
    color,
    size,
    imgUrl,
    quantity
  } = req.query;

  updateShoppingCartOnSession(req, productId, categoryId, name, price, color, size, imgUrl, quantity);
  res.redirect('/shopping-cart');
});

// Retrieve the shopping cart from session, and wrap it into an 'items' array, which is the format expected by amp-list.
app.get('/api/cart-items', function (req, res) {
  let cart = getCartFromSession(req);

  let response = { items: [cart] };

  res.send(response);
});

app.get('/api/cart-count', function (req, res) {
  const { cartItems = [] } = getCartFromSession(req);
  res.send({ items: [{ count: cartItems.length }] });
});

app.post('/api/delete-cart-item', function (req, res) {
  const { productId, color, size } = req.fields;

  let shoppingCartResponse = { items: [] };

  if (shoppingCart) {
    shoppingCart = serializer.deserialize(shoppingCart);
    shoppingCart.removeItem(productId, color, size);
    session.shoppingCart = serializer.serialize(shoppingCart);
    shoppingCartResponse.items.push(shoppingCart);
  }

  res.send(shoppingCartResponse);
});


/** HELPERS **/

// If the session contains a cart, then deserialize it and return that!
// Otherwise, create a new cart, add that to the session and return the cart object.
function getCartFromSession({ session: { shoppingCart } }) {
  return (shoppingCart)
  ? serializer.deserialize(shoppingCart)
  : apiManager.createCart();
}

//Create a cart new item. If the cart exists in the session, add it there.
//Otherwise, create a new cart and add the recently created item to the session.
function updateShoppingCartOnSession(req, productId, categoryId, name, price, color, size, imgUrl, quantity) {
  let cartProduct = apiManager.createCartItem(productId, categoryId, name, price, color, size, imgUrl, quantity);
  let shoppingCartJson = req.session.shoppingCart;
  let shoppingCartObj = (shoppingCartJson)
    ? serializer.deserialize(shoppingCartJson)
    : apiManager.createCart();

  shoppingCartObj.addItem(cartProduct);
  req.session.shoppingCart = serializer.serialize(shoppingCartObj);
}
