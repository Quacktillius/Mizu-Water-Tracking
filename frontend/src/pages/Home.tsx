import React from 'react';
import { useState, useEffect } from 'react';
import { number, string } from 'yargs';
import AuthContext from '../context/auth-context';
import PropTypes from 'prop-types'
import '../styling/Home.css';

import bottleLogo from './../styling/images/bottle.png';
import cupLogo from './../styling/images/cup.png';
import cupSmallLogo from './../styling/images/cupSmall.png';

const Home = ({ user_email, token } : {user_email:string, token:string}) => {
    const [bottle, setBottle] = useState(0);
    const [bottles, setBottles] = useState([12,16.9,26]);
    const [water, setWater] = useState([0]);
    const [waterGoal, setWaterGoal] = useState(300);

    const [notFirstLoad, notfirstload] = useState(false);

    const auth_context = React.useContext(AuthContext);

    useEffect(() => {
        if(notFirstLoad) return;
        selectBottle(0, -1);
        gettingWaterData(true);
        notfirstload(true);
    });

    const selectBottle = (choose: number, move: number) => {

        // Go through list of bottles User Has
        const requestBody = {
            query: `
                query {
                    getBottles
                }
            `
        };

        fetch('http://localhost:8000/graphql', {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed')
            }
            return res.json();
        })
        .then(resData => {
            if( resData.data.getBottles ) {
                setBottles(resData.data.getBottles);
            }
        })
        .catch(err => {
            console.log(err);
        });

        if(choose !== -1) {
            setBottle(choose);
            console.log(bottle);
        } else {

            if(!(bottle + move < 0 || bottle + move > bottles.length - 1 )) {
                setBottle(bottle + move);
                console.log(bottle);
            }
            
        }
    };

    const addDrink = () => {
        const requestBody = {
            query: `
                mutation {
                    createDrink(volume:${bottles[bottle]}) {
                        _id
                    }
                }
            `
        };

        fetch('http://localhost:8000/graphql', {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed')
            }
            return res.json();
        })
        .then(resData => {
            // Have Added Drink and Gotten Drink ID in resData
            console.log(resData);

            gettingWaterData(false);

        })
        .catch(err => {
            console.log(err);
        });
    };

    const bottleImages = [
        cupSmallLogo,
        cupLogo,
        bottleLogo
    ]

    const gettingWaterData = (firstCall:boolean) => {
        var errorValue = 0;
        if(!firstCall) {
            errorValue = bottles[bottle];
        }

        const requestBody = {
            query: `
                query {
                    getWaterData
                }
            `
        };

        fetch('http://localhost:8000/graphql', {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed')
            }
            return res.json();
        })
        .then(resData => {
            // Setting the water consumption data
            setWater(resData.data.getWaterData.map((x:number)=>{return x+errorValue}));
        })
        .catch(err => {
            console.log(err);
        });
    }

    return (
        <div className="home-container">
            <div className="menu-wrap">
                <input type="checkbox" name="" id="" className="toggler" />
                <div className="hamburger"><div></div></div>
                <div className="menu">
                    <div>
                        <div>
                            <h1>You Drank</h1>
                            <div className="water-info-flex">
                                <div className="water-info">
                                    <h3 className="category">
                                    &nbsp;This&nbsp;Day&nbsp;
                                    </h3>
                                    <p className="data">
                                        {water[0]}oz
                                    </p>
                                </div>

                                <div className="water-info">
                                    <h3 className="category">
                                        This&nbsp;Month
                                    </h3>
                                    <p className="data">
                                        {water[1]}oz
                                    </p>
                                </div>

                                <div className="water-info">
                                    <h3 className="category">
                                        This&nbsp;Year
                                    </h3>
                                    <p className="data">
                                        {water[2]}oz
                                    </p>
                                </div>
                            </div>
                            <div className="cool-button">
                                <div className="left-line"></div>
                                <button id="logout" onClick={()=>{auth_context.logout();}}>Logout</button>
                                <div className="right-line"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className="main-tracker">
                {waterGoal > water[0] && 
                <h2 id="water-goal">
                    {`${(waterGoal - water[0]).toFixed(2)}oz`}
                </h2>
                }
                <p id="water-goal-message">
                    {waterGoal > water[0] ? "Till Daily water Goal" : "Daily Water Goal Reached"}
                </p>
                <div className="select-bottle" >
                    <button onClick={()=>{selectBottle(-1, -1)}}>&#x21a2;</button>
                    <div className="bottle-selector-display">
                        <div className="progressbar" style={{height:`${water[0]/waterGoal*95}%`}}></div>
                        {bottles[bottle] && <img src={bottleImages[bottle]} height="100%" width="100%" />}
                    </div>
                    <button onClick={()=>{selectBottle(-1, 1)}}>&#x21a3;</button>
                </div>
                <h3 className="volume">
                    {bottles[bottle]?`${bottles[bottle]}oz`:"Select a Bottle"}
                </h3>
                <button onClick={addDrink} id="drink-btn">
                    Drink it
                </button>
            </div>
            {/* <div className="sideview">
                <h2>
                    Water&nbsp;Drank
                </h2>
                <div className="water-info">
                    <h3 className="category">
                        Today
                    </h3>
                    <p className="data">
                        {water[0]}oz
                    </p>
                </div>

                <div className="water-info">
                    <h3 className="category">
                        This&nbsp;Month
                    </h3>
                    <p className="data">
                        {water[1]}oz
                    </p>
                </div>

                <div className="water-info">
                    <h3 className="category">
                        This&nbsp;Year
                    </h3>
                    <p className="data">
                        {water[2]}oz
                    </p>
                </div>
            </div> */}
            
            
        </div>    
    )
}

export default Home;