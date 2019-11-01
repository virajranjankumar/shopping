const jsonServer = require('json-server')
const path = require('path')
const requireJSON = f => require(`../deals/${f}.json`).map(o => ({...o, source: f}))
const carrefour = requireJSON('carrefour');
const choithrams = requireJSON('choithrams');
const unioncoop = requireJSON('unioncoop');
const lulu = requireJSON('lulu');
const emax = requireJSON('emax');
const querystring = require('querystring');

// const [ port = 3000 ] = process.argv.slice(2);

const autocomplete = unioncoop.map(({description, name}) => ({description, name, source: 'unioncoop'} ))
                  .concat(lulu.map(({description, name}) => ({description, name, source: 'lulu'})))
                  .concat(emax.map(({description, name}) => ({description, name, source: 'emax'})))
                  .concat(choithrams.map(({description, name}) => ({description, name, source: 'choithrams'})))
                  .concat(carrefour.map(({description, name}) => ({description, name, source: 'carrefour'})))

const server = jsonServer.create()
const router = jsonServer.router(function() {
  return {
      autocomplete,
      carrefour,
      unioncoop,
      lulu,
      emax,
      choithrams,
      all: [].concat.apply([], [lulu, emax, carrefour, choithrams, unioncoop])
  }
}())
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.post('/echo', (req, res) => res.jsonp(req.query))
server.use((req, res, next) => {
  const query = req.query;
  delete query['__amp_source_origin']
  query['_page'] = parseInt(query['_page']) + 1
  const fullUrl = req.protocol + '://' + req.get('host') + req.path
  req.nextPath = `${fullUrl}?${querystring.stringify(query)}`
  next()
})

server.use(router)
const jsonListener = server.listen(process.env.DB_PORT, () => {
  console.log('JSON Server is running', jsonListener.address().port)
})

router.render = (req, res) => {
  const next = res.locals.data.length == 0 ? null : req.nextPath
  res.jsonp({ items: res.locals.data, next })
}
