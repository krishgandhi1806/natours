const User = require("../models/userModel");
const catchAsync= require('./../utils/catchAsync');
const AppError= require('./../utils/appError');
const factory= require('./handlerFactory');
const multer= require('multer');
const sharp= require('sharp');

// const multerStorage= multer.diskStorage({
//     destination: (req, file, cb)=>{
//         cb(null, 'public/img/users')
//     },
//     filename: (req, file, cb)=>{
//         const ext= file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// });

const multerStorage= multer.memoryStorage();

const multerFilter= (req, file, cb)=>{
    if(file.mimetype.startsWith('image'))
    {
        cb(null, true)
    }
    else{
        cb(new AppError("Not an image! Please upload only images", 400), false)
    }
}

const upload= multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto= upload.single('photo');

exports.resizeUserPhoto= catchAsync(async (req, res, next)=>{
    if(!req.file) return next();

    req.file.filename= `user-${req.user.id}-${Date.now()}.jpeg`

    await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').toFile(`public/img/users/${req.file.filename}`);

    next();
});


const filterObj= (obj, ...allowedFields)=>{
    const newObj= {};
    Object.keys(obj).forEach(el=>{
        if(allowedFields.includes(el)) newObj[el]= obj[el];
    })
    return newObj;
}

exports.getMe= (req, res, next)=>{
    req.params.id= req.user.id;
    next();
}

exports.updateMe= catchAsync( async (req, res, next)=>{
    // 1) Create error if users post's password data
    if(req.body.password || req.body.passwordConfirm)
    {
        return next(new AppError("This route is not for updaing passwords. Please use /updateMyPassword", 400));
    }

    // 2) Filtered out unwanted field names that are not allowed
    const filteredBody= filterObj(req.body, 'name', 'email');
    if(req.file) filteredBody.photo= req.file.filename;
    
    // 3) Uodate user Document
    const updatedUser= await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });


    res.status(200).json({
        status:'success',
        data:{
            user: updatedUser
        }
    })
});

exports.deleteMe= catchAsync( async (req, res, next)=>{
    await User.findByIdAndUpdate(req.user.id,{active: false});

    res.status(204).json({
        status: "success",
        data: null
    })
});

exports.createUser= (req, res)=>{
    res.status(500).json({
        status: "Error",
        message: "Route is under Development Process"
    })
}

exports.updateUser= factory.updateOne(User);
exports.deleteUser= factory.deleteOne(User);
exports.getUser= factory.getOne(User);
exports.getAllUsers= factory.getAll(User);