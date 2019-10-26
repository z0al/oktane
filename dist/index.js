
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./anyql.cjs.production.min.js')
} else {
  module.exports = require('./anyql.cjs.development.js')
}
