import React from 'react';

export default React.createContext({
    token: "",
    user_email: "",
    login: (user_email, token, tokenExpiration)=>{},
    logout: ()=>{} 
});