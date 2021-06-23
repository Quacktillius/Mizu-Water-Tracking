
import { useState } from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import AuthPage from './pages/Auth';
import HomePage from './pages/Home';
import AuthContext from './context/auth-context';

function App() {
  const [login_token, setToken] = useState('')
  const [login_user_email, setUserEmail] = useState('')
  const [login_tokenExpiration, setTokenExpiration] = useState(0)

  return (
    <BrowserRouter>
      <AuthContext.Provider value={
        {
          token: login_token,
          user_email: login_user_email,
          login: (user_email: String, token: String, tokenExpiration: number)=>{
            setToken(token.toString());
            setUserEmail(user_email.toString());
            setTokenExpiration(tokenExpiration);
          },
          logout: ()=>{
            setToken("");
            setUserEmail("");
            setTokenExpiration(0);
          }
        }
      }>
        {!login_token  && <AuthPage/>}
        {login_token && <HomePage user_email={login_user_email} token={login_token} />}
        {/* <Switch>
          <Redirect from="/" to="/auth" exact />
          {!login_token && <Route path="/auth" component={AuthPage} />}
          {login_token && <Redirect from="/auth" to="/home" />}
          {login_token && <Route path="/home" component={HomePage} />}
          {!login_token && <Redirect from="/home" to="/auth" />}
        </Switch> */}
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

export default App;
