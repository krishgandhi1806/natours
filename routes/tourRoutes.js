const express= require('express');
const toursController= require('../controllers/toursController');
const authController= require('../controllers/authController');
const reviewRouter= require('./reviewRoutes');


const router= express.Router();

router.use('/:tourId/reviews', reviewRouter)

// router.param('id', toursController.checkid);

router
    .route('/top-5-cheap')
    .get(toursController.aliasTopTours, toursController.getAllTours)

router
    .route('/tour-stats')
    .get(toursController.getTourStats)

router
    .route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide') ,toursController.getMonthlyPlan)


router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(toursController.getToursWithin);

router
    .route('/distances/:latlng/unit/:unit')
    .get(toursController.getDistances);


router
    .route('/')
    .get(toursController.getAllTours)
    .post(authController.protect, toursController.postTour)

router
    .route('/:id')
    .get(toursController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'),toursController.uploadTourImages, toursController.resizeTourImages, toursController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), toursController.deleteTour);


// Reviews
// router
//     .route('/:tourId/reviews')
//     .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

module.exports= router;