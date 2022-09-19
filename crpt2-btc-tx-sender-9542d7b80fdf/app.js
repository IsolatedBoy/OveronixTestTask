var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const bitcoinRouter = require('./routes/bitcoinRouter');
const ethereumRouter = require('./routes/ethereumRouter');
const tronRouter = require('./routes/tronRouter');
const litecoinRouterFake = require('./routes/litecoinRouter.fake');

var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bitcoin', bitcoinRouter);
app.use('/ethereum', ethereumRouter);
app.use('/tron', tronRouter);
app.use('/litecoin', litecoinRouterFake);

app.get('/health', async (req, res, next) => {
  res.send({
    status: true
  })
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(process.env.APPLICATION_PORT || 3000, process.env.APPLICATION_HOST, () => {
  console.log(`App listening at http://${process.env.APPLICATION_HOST}:${process.env.APPLICATION_PORT || 3000}`)
})

module.exports = app;



