// <====Importing Packages====>
const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { argsToArgsConfig } = require('graphql/type/definition');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { json } = require('body-parser');
const isAuth = require('./middleware/is-auth');
const app = express();

// <====Middleware====>
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if(req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// <====Temporary Database====>
const bottles = [];
const drinks = [];
const users = [];

// Executes callBack, which handles the returned data from the file.
function jsonReader(filePath, callBack) {
    fs.readFile(filePath, 'utf-8', (err, fileData) => {
        if(err) {
            return callBack && callBack(err);
        }
        try {
            const data = JSON.parse(fileData);
            return callBack && callBack(null, data);
        } catch (err) {
            return callBack && callBack(err);
        }
    });
}

app.use(isAuth);

// <====GraphQL====>
app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type User {
            email:  ID!
            password: String!
            name:   String!
            drinks: [Drink!]!
            bottles:[Bottle!]!
        }

        type AuthData {
            user_email: ID!
            token: String!
            tokenExpiration: Int!
        }

        type Date {
            year:   Int!
            month:  Int!
            date:   Int!
        }

        type Drink {
            _id:    ID!
            date:   Date!
            volume: Float!
            user:   User!
        }

        type Bottle {
            _id:    ID!
            volume: Float!
        }

        type RootQuery {
            getBottles  : [Float!]!
            getDrinks   (mode: String!): [Drink!]!
            getWaterData: [Float!]!
            login       (user_email: String!, password: String!): AuthData!
        }

        type RootMutation {
            createUser      (name: String!, email: String!, password: String!): AuthData!
            createDrink     (volume: Float!): Drink!
            createBottle    (user_id: ID!, volume: Float!): Bottle!
            deleteBottle    (user_id: ID!, bottle_id: ID!): Bottle!
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        login: ({user_email, password}) => {
            const data = require('./database.json');
            const user = data[user_email];
            
            if(!user) {
                return { user_email: "Incorrect Credentials", token: "", tokenExpiration: 0 }
            }

            if(user.password !== password) {
                return { user_email: "Incorrect Credentials", token: "", tokenExpiration: 0 }
            }

            const token = jwt.sign({user_email: user.email, user_name: user.name}, "somesupersecretkey", { expiresIn: "1h"});

            return { user_email: user.email, token: token, tokenExpiration: 1 }
        },
        createUser: (args) => {
            const data = require('./database.json');
            // User already exits
            if(data[args.email]) {
                return { user_email: "This user already exits", token: "", tokenExpiration: 0 }
            }
            const standardBottles = [
                {
                    _id: args.email + "12",
                    volume: 12
                },
                {
                    _id: args.email + "16.9",
                    volume: 16.9
                },
                {
                    _id: args.email + "26",
                    volume: 26
                }
            ];

            // Create user object
            const User = {
                name:   args.name,
                email:  args.email,
                password: args.password,
                bottles: standardBottles,
                drinks: []
            }

            // Add User to database
            jsonReader('./database.json', (err, data) => {
                if(!err) {
                    data[args.email] = User;
                    fs.writeFile('./database.json', JSON.stringify(data, null, 2), err => {});
                }
            });

            const token = jwt.sign({user_email: User.email, user_name: User.name}, "somesupersecretkey", { expiresIn: "1h"});

            return { user_email: User.email, token: token, tokenExpiration: 1 }
        },
        createDrink: (args, req) => {
            if(!req.isAuth) {
                throw new Error("Unauthenticated from createDrink");
            }

            // Create Drink Object
            const today = new Date();
            const Drink = {
                _id: req.user_email + "_" + args.volume + "_" + (today.toISOString()),
                date: {
                    year:   today.getFullYear(),
                    month:  today.getMonth(),
                    date:    today.getDate()
                },
                volume: args.volume,
                user: req.user_email
            }

            // Add to users's drinks
            jsonReader('./database.json', (err, data) => {
                if(!err) {
                    data[req.user_email].drinks.push(Drink);
                    fs.writeFile('./database.json', JSON.stringify(data, null, 2), err => {});
                }
            });

            return Drink;
        },
        createBottle: (args, req) => {
            if(!req.isAuth) {
                throw new Error("Unauthenticated");
            }

            // Create Bottle Object
            const Bottle = {
                _id: args.user_id + "_" + args.volume,
                volume: +args.volume
            }
            
            // Add to user's list of bottles
            jsonReader('./database.json', (err, data) => {
                if(!err) {
                    data[args.user_id].bottles.push(Bottle);
                    fs.writeFile('./database.json', JSON.stringify(data, null, 2), err => {});
                }
            });

            return Bottle
        },
        getBottles: (args, req) => {
            if(!req.isAuth) {
                throw new Error("Unauthenticated in getBottles");
            }

            const data = require('./database.json');
            return data[req.user_email]["bottles"].map(bottle => bottle.volume);
        },
        getDrinks: (args, req) => {
            if(!req.isAuth) {
                throw new Error("Unauthenticated");
            }

            const user_id = req.user_email;
            const mode = args.mode

            // Not reading asyncronouslly (spelling??) because otherwise it doesnt wait for it and returns null
            const data = require('./database.json');
            
            if (mode === "day") {
                const isToday = (someDate) => {
                    const today = new Date()
                    return  someDate.date == today.getDate() && 
                            someDate.month== today.getMonth() && 
                            someDate.year == today.getFullYear();
                }
                const user_drinks = data[user_id].drinks;
                const today_drinks = []
                for(var i = 0; i < user_drinks.length; i++) {
                    if(isToday(user_drinks[i].date)) {
                        today_drinks.push(user_drinks[i])
                    }
                }

                return today_drinks;

            } else if (mode === "month") {
                const isMonth = (someDate) => {
                    const today = new Date()
                    return  someDate.month== today.getMonth() && 
                            someDate.year == today.getFullYear();
                }
                const user_drinks = data[user_id].drinks;
                const month_drinks = []
                for(var i = 0; i < user_drinks.length; i++) {
                    if(isMonth(user_drinks[i].date)) {
                        month_drinks.push(user_drinks[i])
                    }
                }

                return month_drinks;

            } else if (mode === "year") {
                const isYear = (someDate) => {
                    const today = new Date()
                    return someDate.year == today.getFullYear();
                }
                const user_drinks = data[user_id].drinks;
                const year_drinks = []
                for(var i = 0; i < user_drinks.length; i++) {
                    if(isYear(user_drinks[i].date)) {
                        year_drinks.push(user_drinks[i])
                    }
                }

                return year_drinks;
            } 
            return data[user_id]["drinks"];
            
        },
        getWaterData: (args, req) => {
            if(!req.isAuth) {
                throw new Error("Unauthenticated");
            }

            const user_id = req.user_email;
            var today = 0, month = 0, year = 0;

            // Not reading asyncronouslly (spelling??) because otherwise it doesnt wait for it and returns null
            const data = require('./database.json');
            
            
            const isWithinPeriod = (someDate, mode) => {
                mode = {"today":1, "month":2, "year":3}[mode]
                const today = new Date()
                return  (1 < mode ||  someDate.date == today.getDate()) && 
                        (2 < mode ||  someDate.month== today.getMonth()) && 
                        (3 < mode ||  someDate.year == today.getFullYear());
            }

            const user_drinks = data[user_id].drinks;
            const today_drinks = []
            for(var i = 0; i < user_drinks.length; i++) {
                if(isWithinPeriod(user_drinks[i].date, "today")) {
                    today += user_drinks[i].volume;
                }
                if(isWithinPeriod(user_drinks[i].date, "month")) {
                    month += user_drinks[i].volume;
                }
                if(isWithinPeriod(user_drinks[i].date, "year")) {
                    year  += user_drinks[i].volume;
                }
            }

            return [today, month, year];
            
        }
    },
    graphiql: true
}));

app.listen(8000);