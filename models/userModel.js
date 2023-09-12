const mongoose= require('mongoose');
const validator= require('validator');
const bcrypt= require('bcryptjs');
const crypto= require('crypto');
const moment= require('moment-timezone');

const userSchema= new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: [true, 'Email address is required'],
        validate: [validator.isEmail, 'Please provide a valid email email address']
    },
    photo:{
        type: String,
        default: 'default.jpg'
    },
    password:{
        type: String,
        required: true,
        minLength: 8,
        select: false
    },
    role:{
        type: String,
        default: 'user',
        enum: ['user', 'guide', 'lead-guide', 'admin']

    },
    passwordConfirm:{
        type: String,
        required: true,
        validate:{
            validator: function(el){
                return el === this.password;
            },
            message: "Passwords are not same"
        }
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type: Boolean,
        select: false
    }
})

userSchema.pre(/^find/,function(next)
{
    this.find({active: {$ne: false}});
    next();
})

userSchema.pre('save', async function(next)
{
    if(!this.isModified("password")){
        return next();
    }

    this.password= await bcrypt.hash(this.password, 12);
    this.passwordConfirm= undefined;
    next();
});

userSchema.pre('save', function(next){
    if(!this.isModified('password')|| this.isNew)
    {
        return next();
    }

    this.passwordChangedAt= Date.now()- 1000;
    next();
})

userSchema.methods.passwordCorrect= function(candidatePassword, userPassword)
{
    const result =bcrypt.compare( candidatePassword, userPassword );
    return result;
}

userSchema.methods.changedPasswordAfter= function(JWTTimeStamp)
{
    if(this.passwordChangedAt){
        const changedTimeStamp= parseInt(this.passwordChangedAt.getTime()/1000, 10);
        return JWTTimeStamp < changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken= function()
{
    const resetToken= crypto.randomBytes(32).toString('hex');

    this.passwordResetToken= crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires= Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User= mongoose.model('User', userSchema);
module.exports= User;