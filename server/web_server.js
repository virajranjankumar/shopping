const express = require('express');
const formidableMiddleware = require('express-formidable');
const sessions = require("client-sessions");
const serializer = require('serialize-to-js');
const ampCors = require('amp-toolbox-cors');
const AmpOptimizer = require('amp-toolbox-optimizer');

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
app.use(express.static('dist'))
app.use(express.static('img'))

const port = process.env.PORT || 8080;
const listener = app.listen(port, () => {
  console.log('App listening on port ' + listener.address().port);
});

// app.get('/shopping-cart', function (req, res) {

//   //get related products for the cart page: items belonging to the category of the first item in the cart, excluding the item.
//   let shoppingCart = req.session.shoppingCart;
//   let relatedProductsObj = new Object();

//   if (shoppingCart) {
//     shoppingCart = serializer.deserialize(shoppingCart);
//     let cartItems = shoppingCart.cartItems;
//     if (cartItems.length > 0) {
//       let firstCartItem = cartItems[0];
//       relatedProductsObj.id = firstCartItem.productId;
//     }
//   }

//   // renderPage(req, res, 'cart-details', relatedProductsObj);
//   res.json(relatedProductsObj);
// });


// /** API **/

// app.post('/api/add-to-cart', function (req, res) {

//   //If comes from the cache
//   /*
//   if (req.headers['amp-same-origin'] !== 'true') {
//     //transfrom POST into GET and redirect to same url
//     let queryString = 'productId=' + productId + '&categoryId=' + categoryId + '&name=' + name + '&price=' + price + '&color=' + color + '&size=' + size + '&quantity=' + quantity + '&origin=' + origin + '&imgUrl=' + imgUrl;
//     res.header("AMP-Redirect-To", cannonicalUrl + "/api/add-to-cart?" + queryString);
//   } else {
//     updateShoppingCartOnSession(req, productId, categoryId, name, price, color, size, imgUrl, quantity);
//     res.header("AMP-Redirect-To", origin + "/shopping-cart");
//   }
//   */
//   updateShoppingCartOnSession(req, req.fields.productId, req.fields.source);
//   //amp-form requires json response
//   res.json({});
// });

// app.get('/api/add-to-cart', function (req, res) {
//   updateShoppingCartOnSession(req, req.query.productId, req.query.source);
//   res.redirect('/shopping-cart');
// });

// // Retrieve the shopping cart from session, and wrap it into an 'items' array, which is the format expected by amp-list.
// app.get('/api/cart-items', function (req, res) {
//   const cart = getCartFromSession(req);
//   res.send({ items: [cart] });
// });

// app.get('/api/cart-count', function (req, res) {
//   const { cartItems = [] } = getCartFromSession(req);
//   res.send({ items: [{ count: cartItems.length }] });
// });

// app.post('/api/delete-cart-item', function (req, res) {
//   const { productId } = req.fields;

//   let shoppingCartResponse = { items: [] };

//   if (shoppingCart) {
//     shoppingCart = serializer.deserialize(shoppingCart);
//     shoppingCart.removeItem(productId);
//     session.shoppingCart = serializer.serialize(shoppingCart);
//     shoppingCartResponse.items.push(shoppingCart);
//   }

//   res.send(shoppingCartResponse);
// });


// /** HELPERS **/

// // If the session contains a cart, then deserialize it and return that!
// // Otherwise, create a new cart, add that to the session and return the cart object.
// function getCartFromSession({ session: { shoppingCart } }) {
//   return (shoppingCart)
//   ? serializer.deserialize(shoppingCart)
//   : createCart();
// }

// //Create a cart new item. If the cart exists in the session, add it there.
// //Otherwise, create a new cart and add the recently created item to the session.
// function updateShoppingCartOnSession(req, productId, source) {
//   let cartProduct = { productId, source };
//   let shoppingCartJson = req.session.shoppingCart;
//   let shoppingCartObj = (shoppingCartJson)
//     ? serializer.deserialize(shoppingCartJson)
//     : createCart();
  
//   shoppingCartObj.addItem(cartProduct);
//   req.session.shoppingCart = serializer.serialize(shoppingCartObj);
// }

// function createCart() {
//   return {
//     cartItems: [],
//     isEmpty: true,
//     addItem: function (item) {
//       //check if item exists in cart before pushing
//       var foundItem = this.cartItems.filter(e => e.productId == item.productId);
//       if (foundItem.length === 0) {
//         this.cartItems.push(item);
//         this.isEmpty = false;
//       }
//     },
//     removeItem: function (productId) {
//       for (var i = 0; i < this.cartItems.length; i++) {
//         if (this.cartItems[i].productId === productId) {
//           this.cartItems.splice(i, 1);
//           if (this.cartItems.length == 0) {
//             this.isEmpty = true;
//           }
//         }
//       }
//     }
//   };
// }
