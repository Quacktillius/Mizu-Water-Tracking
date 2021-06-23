import React from 'react';
import {useState} from 'react';
import AuthContext from '../context/auth-context';
import '../styling/Auth.css';

const Auth = () => {
    const [login_email, setLoginEmail] = useState('example@gmail.com')
    const [login_password, setLoginPassword] = useState('example')

    const [register_email, setRegisterEmail] = useState('')
    const [register_password, setRegisterPassword] = useState('')
    const [registered, setRegistered] = useState(false)

    const auth_context = React.useContext(AuthContext);

    const tryLogin = (e:React.SyntheticEvent) => {
        e.preventDefault()
        if(!login_email || !login_password || login_email.trim().length == 0 || login_password.trim().length == 0) {
            alert('Enter a valid Email and Password');
            return
        }
        // Have to check if user exits

        // Login
        const requestBody = {
            query: `
                query {
                    login(user_email: "${login_email}", password: "${login_password}") {
                        user_email
                        token
                        tokenExpiration
                    }
                }
            `
        };

        fetch('http://localhost:8000/graphql', {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed')
            }
            return res.json();
        })
        .then(resData => {
            if(resData.data.login.user_email === "Incorrect Credentials") {
                alert("Incorrect Credentials.\nEither the User does not exist, or the password is incorrect.");
                return;
            }
            if( resData.data.login.token ) {
                auth_context.login(resData.data.login.user_email, resData.data.login.token, resData.data.login.tokenExpiration)
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    const tryRegister = (e:React.SyntheticEvent) => {
        e.preventDefault()
        if(!login_email || !login_password || login_email.trim().length == 0 || login_password.trim().length == 0) {
            alert('Enter a valid Email and Password');
            return
        }

        // Register
        const requestBody = {
            query: `
                mutation {
                    createUser(name: "User", email: "${login_email}", password: "${login_password}") {
                        user_email
                        token
                        tokenExpiration
                    }
                }
            `
        };

        fetch('http://localhost:8000/graphql', {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed')
            }
            return res.json();
        })
        .then(resData => {
            console.log(resData);
            if(resData.data.createUser.user_email === "This user already exits") {
                alert("This user already exits");
                return;
            }
            if( resData.data.createUser.token ) {
                auth_context.login(resData.data.createUser.user_email, resData.data.createUser.token, resData.data.createUser.tokenExpiration)
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    return (
        <div className="auth-container">
            {/* <div className="background"></div> */}
            <div className="stretch-flex">
                <div className="about">
                    <h3>Welcome.</h3>
                    <p>
                        This is a water-consumption tracking web application.
                        <br /><br />
                        Enter your email and password, and then click either "Log In", if you already have an account, or "Register" to create and then  log in using the newly created account.
                        <br /><br />
                        You may select from a variety of bottle sizes, and click "Drink it" to log your water consumption.
                        <br /><br />
                        You will be shown how much more water you should consume.
                        <br /><br />
                        By clicking on the Menu Icon, you may see consumption data for different time periods, and can also Logout from there. 
                    </p>
                    <br />
                </div>
            </div>

            <div className="stretch-flex form-div">
                <form className="auth-login-form">
                    <div className="auth-form-input">
                        <label htmlFor="email">E-Mail</label>
                        <br />
                        <input type="email" id="email" value={login_email} onChange={(e) => setLoginEmail(e.target.value)} />
                    </div>
                    <div className="auth-form-input">
                        <label htmlFor="password">Password</label>
                        <br />
                        <input type="password" id="password" value={login_password} onChange={(e) => setLoginPassword(e.target.value)}/>
                    </div>
                    <div className="form-actions">
                        <div className="auth-cool-button">
                            <div className="left-line"></div>
                            <button type="button" onClick={tryLogin}>Log In</button>
                            <div className="right-line"></div>
                        </div>
                        
                        <div className="auth-cool-button">
                            <div className="left-line"></div>
                            <button type="button" onClick={tryRegister}>Register</button>
                            <div className="right-line"></div>
                        </div>
                    </div>
                    
                </form>
            </div>

            {/* <form className="auth-register-form" onSubmit={tryRegister}>
                <h3>Register</h3>
                <div className="auth-form-input">
                    <label htmlFor="email">E-Mail</label>
                    <br />
                    <input type="email" id="email" value={register_email} onChange={(e) => setRegisterEmail(e.target.value)}/>
                </div>
                <div className="auth-form-input">
                    <label htmlFor="password">Password</label>
                    <br />
                    <input type="password" id="password" value={register_password} onChange={(e) => setRegisterPassword(e.target.value)}/>
                </div>
                <button type="submit">Register</button>
            </form> */}

        </div>
    )
}

export default Auth;