const jsonServer = require('json-server')
const path = require('path')
// const autocomplete  = require('../templates/api/autocomplete.json');
const carrefour = require('../deals/carrefour.json');
const choithram = require('../deals/choithram.json');
const unioncoop = require('../deals/unioncoop.json');
const lulu = require('../deals/lulu.json');
const emax = require('../deals/emax.json');
const favorite = require('../deals/favorite.json');

const [ port = 3000 ] = process.argv.slice(2);

const autocomplete = unioncoop.map(({description, name}) => ({description, name, source: 'unioncoop'} ))
                  .concat(lulu.map(({description, name}) => ({description, name, source: 'lulu'})))
                  .concat(emax.map(({description, name}) => ({description, name, source: 'emax'})))
                  .concat(choithram.map(({description, name}) => ({description, name, source: 'choithram'})))
                  .concat(carrefour.map(({description, name}) => ({description, name, source: 'carrefour'})))
                  // .concat(Array.from(new Set(
                  //   carrefour.reduce((acc, {category}) => 
                  //     acc.concat(category.map(c => ({description: c, source: 'carrefour'}))), []))))

const server = jsonServer.create()
const router = jsonServer.router(function() {
  return {
      autocomplete,
      favorite,
      carrefour,
      unioncoop,
      lulu,
      emax,
      choithram,
      all: [].concat.apply([], [lulu, emax, carrefour, choithram, unioncoop])
  }
}())
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.get('/echo', (req, res) => res.jsonp(req.query))
server.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(req.body)
    // req.body.createdAt = Date.now()
  }
  next()
})

server.use(router)
server.listen(port, () => {
  console.log('JSON Server is running', port)
})

router.render = (req, res) => {
  res.jsonp({ items: res.locals.data })
}
