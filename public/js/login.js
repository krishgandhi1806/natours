import axios from 'axios';
import { showAlert } from './alerts';

export const login= async(email, password)=>{
    try{
    const res= await axios({
    method: 'POST',
    url: '/api/v1/users/login',
    data:{
        email: email, 
        password: password
    }
   })
   if(res.data.status==='Success')
   {
    showAlert("success","Logged in successfully!");
    location.assign('/');
   }
}catch(err)
{
    showAlert("error", err.response.data.message)
}

}


export const logout= async ()=>{
    try{
    const res= await axios({
        method:"GET",
        url: '/api/v1/users/logout',
    })
    // console.log(res);
    if(res.data.status==='Success') location.assign('/');;
    }catch(err)
    {
        showAlert("error", "Error logging out");
        // console.log(err)
    }

}
