const requireJSON = f => require(`../deals/${f}.json`).map(o => ({...o, source: f}))
const jsonServer = require('json-server')
const carrefour = requireJSON('carrefour');
const choithrams = requireJSON('choithrams');
const unioncoop = requireJSON('unioncoop');
const lulu = requireJSON('lulu');
const categories = requireJSON('categories');
const searchTerms = requireJSON('searchTerms');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs')

const autocomplete = unioncoop.map(({description, name}) => ({description, name, source: 'unioncoop'} ))
                  .concat(lulu.map(({description, name}) => ({description, name, source: 'lulu'})))
                  .concat(choithrams.map(({description, name}) => ({description, name, source: 'choithrams'})))
                  .concat(carrefour.map(({description, name}) => ({description, name, source: 'carrefour'})))
                  .concat(categories.map(({description, name}) => ({description, name, source: 'categories'})))

const server = jsonServer.create()
const router = jsonServer.router(function() {
  return {
      autocomplete,
      carrefour,
      unioncoop,
      lulu,
      choithrams,
      categories,
      searchTerms,
      all: [].concat.apply([], [lulu, carrefour, choithrams, unioncoop])
  }
}())

const middlewares = jsonServer.defaults()
server.use(middlewares)
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json())
server.use(upload.any()); 
server.use((req, res, next) => {
  const { query, protocol, path } = req
  delete query['__amp_source_origin']
  query['_page'] = parseInt(query['_page']) + 1
  req.nextPath = `${protocol}://${req.get('host')}${path}?${querystring.stringify(query)}`
  next()
})
server.use(router)
const jsonListener = server.listen(process.env.PORT, () => {
  console.log('JSON Server is running', jsonListener.address().port)
})

router.render = (req, res) => {
  const { locals: { data = [] } } = res
  if (Array.isArray(data) && data.length > 0) {
    const items = data.map(({
      name, description, label,
      price, url, image, source
    }) => ({
      name, description, label,
      price, url, image, source
    }))
    const next = req.nextPath
    res.jsonp({ items, next })
  } else {
    res.jsonp({ items: data })
  }
  
}
