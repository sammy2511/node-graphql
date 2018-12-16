var { User } = require('./user');


var authenticate = (req,res,next) => {
  var token = req.header('x-auth');
}

module.exports = {authenticate};