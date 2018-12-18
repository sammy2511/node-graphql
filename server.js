var express = require('express');
var graphqlHTTP = require('express-graphql');
const { graphqlExpress } = require('graphql-server-express')
const schema = require('./schema/schema');
const mongoose = require('mongoose');
const  cors =  require('cors');
const SECRET = 'aslkdjlkaj10830912039jlkoaiuwerasdjflkasd';
const webToken = require('jsonwebtoken');
const User = require('./model/user');


var app = express();

// connect to mlab database
mongoose.connect('mongodb://samarpit:s123456@ds157503.mlab.com:57503/notes')
mongoose.connection.once('open', () => {
    console.log('conneted to database');
});

const isLogout = async (email) => {
  const user = await User.findOne({ email : email});
  console.log(user)
  if(user.token === null){
    console.log('inside if')
    return true;
  }

  return false;
}

//authentication middleware
const authenticate = async (req) => {
    const token = req.headers.authorization;
    try {
      const { user } = await webToken.verify(token, SECRET);
      
      const dbUser = await User.findOne({email: user.email});

      if(dbUser.token !== null){
        req.user = user;
      }
      else{
        throw new Error('User logged out')
      }
      
    } catch (err) {
      console.log(err);
    }
    req.next();
  };

  app.use(cors('*'));
  app.use(authenticate);

app.use('/graphql', graphqlHTTP(req => ({
  schema: schema,
  context:{
      user: req.user,
      SECRET
  },
  graphiql: true
})));
app.listen(4000, () => console.log('Now browse to localhost:4000/graphql'));