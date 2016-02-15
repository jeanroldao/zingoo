var express = require('express');
var wagner = require('wagner-core');
var session = require('express-session')
var utils = require('./utils');
var bodyparser = require('body-parser');
var crypto = require('crypto');

require('./models')(wagner);

var app = express();

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(bodyparser.urlencoded({     
  extended: true // to support URL-encoded bodies
})); 

var api = express.Router();

api.use(bodyparser.json());

api.get('/products', wagner.invoke(function(Product) {
  return function(req, res) {
    Product.find({}, utils.handleMany(res));
  };
}));

app.use('/api/v1', api);

app.get('/', wagner.invoke(function(Product, User) {
  return function(req, res) {
    
    User.findById(req.session.user_id || '000000000000000000000000', function(err, user) {
      if (err) {
        res.send(err);
      } else {
        
        Product.find({}, function(err, products) {
          if (err) {
            res.send(err);
          } else {
            var userName = 'No logged user';
            var presents = null;
            var productsNamesById = {};
            products.forEach(function(p) {
              productsNamesById[p._id] = p.name;
            });
            if (user) {
              user.presents.forEach(function(p) {
                p.name = productsNamesById[p.product];
              })

              userName = user.name;
              presents = user.presents;
            }
            res.render('index.html', { 
              products: products, 
              userName: userName,
              user: user,
              presents: presents
            });
          }
        });
      }
    });
  };
}));

app.get('/add/:product', wagner.invoke(function(User, Product) {
  return function(req, res) {
    User.findById(req.session.user_id || '000000000000000000000000', function(err, user) {
      if (err) {
        res.send(err);
      } else if (user) {
        var product = user.presents.filter(function(p) {return p.product == req.params.product})[0];
        if (product) {
          product.quantity++;
        } else {
          user.presents.push({product: req.params.product, quantity: 1});
        }
        user.save(function(err) {
          if (err) {
            res.send(err)
          } else {
            res.redirect('/');
          }
        });
      } else {
        Product.findById(req.params.product, function(err, product) {
          res.redirect('/login?selectedProduct=' + product._id + '&productName=' + product.name);
        });
      }
    });
  };
}));  

app.get('/remove/:product', wagner.invoke(function(User) {
  return function(req, res) {
    User.findById(req.session.user_id || '000000000000000000000000', function(err, user) {
      user.presents.id(req.params.product).remove();
      user.save(function(err) {
        if (err) {
          res.send(err)
        } else {
          res.redirect('/');
        }
      });
    });
  };
}));  

app.post('/product', wagner.invoke(function(Product) {
  return function(req, res) {
    if (!req.body.product) {
      res.redirect('/');
    } else {
      Product.create({ name: req.body.product }, function(err) {
        if (err) {
          res.send(err);
        } else {
          res.redirect('/');
        }
      });
    }

  };
}));

app.get('/login', wagner.invoke(function(User) {
  return function(req, res) {
    User.findById(req.session.user_id || '000000000000000000000000', function(err, user) {
      if (err) {
        res.send(err)
      } else {
        
        var userName = '';
        if (user) {
          userName = user.name;
        }
        
        res.render('login.html', { 
          user: userName,
          selectedProduct: req.query.selectedProduct,
          selectedProductName: req.query.productName
        });
      }
    });
  };
}));

app.post('/login', wagner.invoke(function(User) {
  return function(req, res) {
    if (!req.body.user) {
      req.session.user_id = '';
      res.redirect('/');
      return;
    }
    User.findOne({ name: req.body.user }, function(err, user) {
      if (err) {
        res.send(err)
      } else {
        if (user) {
          req.session.user_id = user._id;
          res.redirect(req.body.callbackUrl || '/');
        } else {
          User.create({ name: req.body.user }, function(err, user) {
            if (err) {
              res.send(err)
            } else {
              req.session.user_id = user._id;
              res.redirect(req.body.callbackUrl || '/');
            }
          });
        }
      }
    });
  };
}));


app.get('/widget/:product', wagner.invoke(function(Product, User) {
  return function(req, res) {
    
    User.findById(req.session.user_id || '000000000000000000000000', function(err, user) {
      if (err) {
        res.send(err);
      } else {
        
        Product.findById(req.params.product, function(err, product) {
          if (err) {
            res.send(err);
          } else {
            var userName = 'No logged user';
            var present = { quantity: 0 };
            if (user) {
              present = user.presents.filter(function(p) {
                return p.product = product._id;
              })[0] || { quantity: 0 };

              userName = user.name;
              presents = user.presents;
            }
            res.render('widget.html', { 
              product: product, 
              userName: userName,
              user: user,
              present: present
            });
          }
        });
      }
    });
  };
}));

app.use(express.static('static'));

app.disable('etag');

app.listen(3000);
console.log('Server listening on port 3000');