import axios from 'axios';
import {showAlert} from './alerts'

export const updateSettings= async (data,type)=>{
    try{
        const url= type==='password'? "/api/v1/users/updateMyPassword": '/api/v1/users/updateMe';
        const res= await axios({
        method: "PATCH",
        url,
        data
    })
    if(res.data.status==='success' || res.data.status==='Success')
    {
        showAlert("success", `${type.toUpperCase()} Successfully updated`)
    }

    }catch(err)
    {
        showAlert("error", "Error submitting data")
    }
}