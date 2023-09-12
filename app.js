const path= require('path');
const express= require('express');
const morgan= require('morgan');
const tourRouter= require('./routes/tourRoutes');
const userRouter= require('./routes/userRoutes');
const reviewRouter= require('./routes/reviewRoutes');
const viewRouter= require('./routes/viewRoutes');
const bookingRouter= require('./routes/bookingRoutes');
const rateLimit= require('express-rate-limit');
const helmet= require('helmet');
const mongoSanitize= require('express-mongo-sanitize');
const xss= require('xss-clean');
const hpp= require('hpp');
const cookieParser= require('cookie-parser')
const compression= require('compression');

const AppError= require('./utils/appError');
const globalErrorHandler= require('./controllers/errorController');

const app= express(); 

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// MIDDLEWARES


// 1) Global Middlewares

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development Logging
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter= rateLimit({
    max: 100,
    windowMs: 60 *60* 1000,
    message: "Too many requests from this IP, please try again later"
})

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));
app.use(cookieParser());
app.use(express.urlencoded({extended: true, limit: '10kb'}));

// Data sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization again XSS(cross side scripting)
app.use(xss());

// Preventing Parameter Pollution
app.use(hpp({
    whitelist:[
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

app.use(compression());

// Test Middleware
app.use( (req, res, next) =>{
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
})
// -------------------------------------------------------------------------------


// Routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next)=>{
    // res.status(404).json({
    //     status: "Fail",
    //     message: `Cannot get ${req.originalUrl} on this server`
    // })

    // const err= new Error(`Cant find ${req.originalUrl} on the server`);
    // err.status= 'fail';
    // err.statusCode= 404;

    next(new AppError(`Cannot get ${req.originalUrl} on this server`, 404));
})

app.use(globalErrorHandler);

// SERVER 

module.exports= app;