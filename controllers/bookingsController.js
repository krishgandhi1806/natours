const stripe= require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour= require('../models/tourModel');
const AppError= require('../utils/appError');
const catchAsync= require('../utils/catchAsync');
const Booking= require('../models/bookingModel');
const factory= require('./handlerFactory');

exports.getCheckoutSession= catchAsync(async (req, res, next)=>{
    // 1) Get the currently booked tour
    // console.log("function stripe")
    const tour= await Tour.findById(req.params.tourId);
    if(!tour)
    {
        return next(new AppError("No tour found with that id", 404));
    }

    // 2) Create checkout session
    const session= await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        mode:'payment',
        line_items:[
            {
                price_data:{
                    product_data:{
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                    },                    
                    unit_amount: tour.price * 100,
                    currency: 'usd'
                },
                quantity: 1
            }
        ]
    });
    // console.log("function stripe")

    // const session = await stripe.checkout.sessions.create({
    //     mode: 'payment',
    //     payment_method_types: ['card'],
    //     success_url: `${req.protocol}://${req.get('host')}/`,
    //     cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    //     customer_email: req.user.email,
    //     client_reference_id: req.params.tourId,
    //     product: [
    //       {
    //         // name: `${tour.name} Tour`,
    //         description: `${tour.summary}`,
    //         price_data: {
    //           unit_amount: tour.price * 100,
    //           currency: 'usd',
    //           product_data: {
    //             name: tour.name,
    //             description: `${tour.summary}`,
    //             images: [tour.imageCover]
    //           }
    //         },
    //         quantity: 1
    //       }
    //     ] 
    //   });
    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    })
    // next();
});


exports.createBookingCheckout= catchAsync(async (req, res, next)=>{
    // This is only TEMPORARY because its unsecure
const { tour, user, price }= req.query;

    if(!user && !tour && !price) return next();

    await Booking.create({tour, user, price});
    res.redirect(req.originalUrl.split('?')[0]);
})

exports.getAllBookings= factory.getAll(Booking);
exports.getBooking= factory.getOne(Booking);
exports.createBooking= factory.createOne(Booking);
exports.updateBooking= factory.updateOne(Booking);
exports.deleteBooking= factory.deleteOne(Booking);