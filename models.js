var mongoose = require('mongoose');
var atob = require('atob');

module.exports = function(wagner) {
  //mongoose.connection.readyState || mongoose.connect('mongodb://localhost:27017/zingoo');
  mongoose.connection.readyState || mongoose.connect(atob("bW9uZ29kYjovL2plYW5yb2xkYW86YTMxMzk4NzZAZHMwMzM3NjcubW9uZ29sYWIuY29tOjMzNzY3L21vbmdvcGhw"));
  
  wagner.factory('db', function() {
    return mongoose;
  });
  
  wagner.factory('Product', function() {
    var schema = new mongoose.Schema({
      name: { 
        type: String, 
        required: true, 
        index: { unique: true } 
      }
    }, { versionKey: false });
    return mongoose.model('Product', schema, 'products');
  });
  
  wagner.factory('User', function() {
    var schema = new mongoose.Schema({
      name: { 
        type: String, 
        required: true, 
        index: { unique: true } 
      },
      presents: [
        { 
          product: String, 
          quantity: Number
        }
      ]
    }, { versionKey: false });
    return mongoose.model('User', schema, 'users');
  });

};