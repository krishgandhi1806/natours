const AppError= require('./../utils/appError')


const sendErrorDev= (err, req, res)=>{
    // A) API
    if(req.originalUrl.startsWith('/api')){
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
    }

    // B) RENDERED WEBSITE
    return res.status(err.statusCode).render('error', {
        title:"Something went wrong",
        msg: err.message
    })

}

const sendErrorProd= (err, req, res)=>{
    // A) API
    if(req.originalUrl.startsWith('/api')){
    // Operational, trusted error: send message to client
    if(err.isOperational){
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }
    // Programming or other unkown error: don't leak error details
    // console.log(err);
    return res.status(500).json({
        status: 'Fail',
        message: 'Something went wrong'
    })
    }

    // B) Rendered website
    if(err.isOperational){
        return res.status(err.statusCode).render('error', {
            title: "Something went Wrong",
            msg: err.message
        })
    }
    return res.status(err.statusCode).render('error', {
        title: "Something went Wrong",
        msg: "Please try again later"
    })

}
const handleCastErrorDB= (err)=>{
    const message= `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB= (err)=>{
    const value= err.errmsg.match(/"(.*?)"/)[0];
    const message= `Duplicate field value: ${value}. Please use another field`
    return new AppError(message, 400);
}

const handleValidationErrorDB= (err)=>{
    const errors= Object.values(err.errors).map(el=> el.message);
    const message= `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTTokenError= ()=>{
    return new AppError("Invalid Token. Please log in again!", 400);
}

const handleJWTTokenExpiredError= ()=>{
    return new AppError("Token Expired! Please log in again", 400);
}

module.exports= (err, req, res, next)=>{
    err.statusCode= err.statusCode || 500;
    err.status= err.status || `error`;

    if(process.env.NODE_ENV==='development'){
    sendErrorDev(err,req, res);
    }
    else if(process.env.NODE_ENV==='production')
    {
    let error= Object.assign(err);
    if (error.name === 'CastError') {
        error = handleCastErrorDB(error);
    }

    if(error.code ===11000){
        error= handleDuplicateFieldsDB(error);
    }

    if(error.name==='ValidationError')
    {
        error= handleValidationErrorDB(error);
    }

    if(error.name==='JsonWebTokenError')
    {
        error= handleJWTTokenError();
    }
    if(error.name==='TokenExpiredError')
    {
        error= handleJWTTokenExpiredError();
    }

    sendErrorProd(error, req, res)
    }
    next();
}