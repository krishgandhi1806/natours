const crypto= require('crypto');
const catchAsync= require('./../utils/catchAsync');
const User= require('./../models/userModel');
const jwt= require('jsonwebtoken');
const AppError= require('./../utils/appError');
const Email= require('./../utils/email');
const { promisify}= require('util');
const moment= require('moment-timezone');

const signToken= id=> {
    return jwt.sign({id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
})};

const createSendToken= (user, statusCode, res)=>{
    const token= signToken(user._id);

    const cookieOptions= {
        expires: new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN *24 *60 *60 *1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV=== 'production') cookieOptions.secure= true;
    res.cookie('jwt', token, cookieOptions);
    // Remove password from output
    user.password= undefined;

    res.status(statusCode).json({
        status: "Success",
        token,
        data:{
            user
        }
    })

}

exports.signup= catchAsync(async (req, res, next)=>{
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    const url= `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);

    // const token= signToken(newUser._id);
    // // jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
    // //     expiresIn: process.env.JWT_EXPIRES_IN
    // // })
    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data:{
    //         user: newUser
    //     }
    // })
});

exports.login= catchAsync(async (req, res, next)=>{
    const { email, password }= req.body;
    // 1) Check if email and password exists
    if(!email || !password)
    {
        next(new AppError("Please provide email and password", 400));
    }
    // 2) Check if user exists and password is correct
    const user= await User.findOne({ email }).select('+password');
    if(!user || !(await user.passwordCorrect(password, user.password))){
        return next(new AppError('Invalid email or password', 401)) ;
    }


    // 3) If everything is Okay, send token to client
    createSendToken(user, 200, res);
    // const token= signToken(user._id);
    // res.status(200).json({
    //     status: "Success",
    //     token
    // })


});

exports.logout= (req,res)=>{
    res.cookie('jwt', "logged out", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        status: "Success"
    })
}

exports.protect= catchAsync(async (req, res, next)=>{
    //1) Getting token and check if it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    {
        token= req.headers.authorization.split(' ')[1];
    }
    // else if(req.cookies.jwt)
    // {
    //     token= req.cookies.jwt;
    // }
    else if (req.cookies.jwt && req.cookies.jwt !== 'logged out') {
        token = req.cookies.jwt;
    }
  
    if(!token)
    {   
        return next(new AppError("You're not logged in. Please log in to get access", 401));
        // return res.status(400).redirect('/login')
    }
    
    // 2) Verification token
    const decoded= await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);

    // 3) Check if user still exists
    const currentUser= await User.findById(decoded.id);
    if(!currentUser)
    {
        return next(new AppError("The user belonging to this token no longer exists!", 401));
    }

    // 4) Check if user changed password after token was issued
    if(currentUser.changedPasswordAfter(decoded.iat))
    {
        return next(new AppError("User recently changed password Please log in again"), 401);
    }



// 5) Grant access
    req.user= currentUser;
    res.locals.user= currentUser;
    next();
});

exports.restrictTo= (...roles)=>{
    return (req, res, next)=>{
        if(!roles.includes((req.user.role)))
        {
            return next(new AppError("You do not have the permission to perform this action!", 403));
        }
        next();
    };
};

exports.forgotPassword= catchAsync(async (req, res, next)=>{
    // 1) Get user based on posted email
    const user= await User.findOne({ email: req.body.email });
    if(!user)
    {
        return next(new AppError("There is no user with this email address!", 404))
    }

    // 2) Generate the random reset token
    const resetToken= user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false});

    // 3) Send it to users email

    // const message= `Forgot your password! Submit a patch request with your new password and passswordConfirm to ${resetURL}.\nIf you didn;t forget your password then pls ignore this email`;
    try
    {
    const resetURL= `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // await sendEmail({
    //     email: user.email,
    //     subject: "Your password reset token! Valid for 10 minutes",
    //     message
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
        status: "success",
        message: "Password reset token sent to email"
    })}
    catch(err)
    {
        user.passwordResetExpiresIn= undefined;
        user.passwordResetToken= undefined;

        await user.save({ validateBeforeSave: false});
        console.log(err);
        return next(new AppError("There is an error sending the email! Please try again later", 500));

    }


});

exports.resetPassword= catchAsync(async (req, res, next)=>{
// 1) Get the user based on the token
const hashedToken= crypto.createHash('sha256').update(req.params.token).digest('hex');
// console.log(hashedToken);
const user= await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
});
// 2) If token has not expired and there is user then set the new password
if(!user)
{
    return next(new AppError("Token is invalid or expied!", 400));
}

user.password= req.body.password;
user.passwordConfirm= req.body.passwordConfirm;
user.passwordResetExpires= undefined;
user.passwordResetToken= undefined;

await user.save();

// 3) Update changedPasswordAt property for the user in userModel.js file
// 4) Log the user in, send the JWT
createSendToken(user, 200, res);
// const token= signToken(user._id);
// res.status(200).json({
//     status: "success",
//     token
// });

})

exports.updatePassword= catchAsync(async (req, res, next)=>{
    // 1) Get user from Collection
    const user= await User.findById(req.user.id).select('+password');


    // 2) Check if Posted current password is correct
    if(!await user.passwordCorrect(req.body.passwordCurrent, user.password)){
        return next(new AppError("your current password is wrong", 401));
    }
    // 3) If so, update Password
    user.password= req.body.password;
    user.passwordConfirm= req.body.passwordConfirm;
    await user.save();
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});

exports.isLoggedIn= async (req, res, next)=>{
    try{
    if(req.cookies.jwt){
    // 1) Verify token
    const decoded= await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
    console.log(decoded);

    // 2) Check if user still exists
    const currentUser= await User.findById(decoded.id);
    if(!currentUser)
    {
        return next();
    }

    // 3) Check if user changed password after token was issued
    if(currentUser.changedPasswordAfter(decoded.iat))
    {
        return next();
    }

    // 4) Grant access
    res.locals.user= currentUser;
    return next();
    }
    }catch(err)
    {
        return next();
    }
    next();
};

