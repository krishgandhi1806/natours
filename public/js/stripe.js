import axios from 'axios';
import { showAlert } from './alerts';


export const bookTour= async tourId =>{
    const stripe= Stripe("pk_test_51NpD5FSBtYTc4ZvIBtqzrk5s8mjtpjWzk5si0mOeRwY1DoBRMqipO2JO8wmhxidlyHu6sp8n4BlEhPdcLsyZBKd900EDkCsvqf");
    try{
        // 1) Get checkout session from api
        const session= await axios({
            method:'POST',
            url: `/api/v1/booking/checkout-session/${tourId}`});
        // console.log(session);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }catch(err){
        showAlert('error', err);
    }
}