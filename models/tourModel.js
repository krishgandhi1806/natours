const mongoose= require('mongoose');
const slugify= require('slugify');
// const User= require('./userModel')

const tourSchema= new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        minlength: [10, "Length of name should be more than 10"],
        maxlength: [40, "Length of name should be more than 10"]
    },
    slug: String,
    duration:{
        type: Number,
        required: [true, "A tour must have a duration"]
    },
    maxGroupSize:{
        type: Number,
        required: [true, "A tour must have a group size"]
    },
    difficulty:{
        type: String,
        required: [true, "A tour must have a difficulty"],
        enum:{
            values: ['easy', 'medium', 'difficult'],
            message: "Difficulty can be only easy, medium and difficult"
        }
    },
    ratingsAverage:{
        type: Number,
        default: 4.5,
        min: [1,"Rating should be between 1 and 5"],
        max: [5,"Rating should be between 1 and 5"]
    },
    ratingsQuantity:{
        type: Number,
        default: 0
    },
    price:{
        type: Number,
        required: [true, "A tour must have a price"]
    },
    priceDiscount: {
       type: Number,
       validate:{
        validator: function(val){
            return val< this.price;
        },
        message: "Discount ({{VAL}}) must be less than price "
       }
    },
    summary:{
        type: String,
        trim: true
    },
    description:{
        type: String,
        trim: true,
        required: [true, "A tour must have a description"]
    },
    imageCover:{
        type: String,
        required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date] ,
    secretTour: Boolean,
    startLocation:{
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations:[
        {
            type:{
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
{
    toJSON: { virtuals: true},
    toObject: { virtuals: true}
});

tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug:1});
tourSchema.index({startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

tourSchema.pre('save', function(next){
    this.slug= slugify(this.name, {lower: true});
    next();
})

// tourSchema.pre('save', async function(next){
//     const guidesPromises= this.guides.map(async id=>await User.findById(id));
//     this.guides= await Promise.all(guidesPromises);
//     next();
// })

tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}})
    this.start= Date.now();
    next();
} );

tourSchema.pre(/^find/, function(next)
{
    this.populate({
        path: 'guides',
        select: "-__v -passwordChangedAt"
    });
    next();
});

tourSchema.post(/^find/, function(docs,next){
    // console.log(docs);
    console.log(`The query took ${Date.now()- this.start} miliseconds`);
    next();
} )


// Aggregation middleware
// tourSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({ $match: { secretTour: {$ne: true}}});
//     next();
// })

const Tour= mongoose.model('Tour', tourSchema);
module.exports= Tour;