const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader) {
        req.isAuth = false;
        console.log('1 No Authorization');
        return next();
    }

    const token = authHeader.split(" ")[1];
    if(!token || token === "") {
        req.isAuth = false;
        console.log('Empty Authorization');
        return next();
    }

    let decodedToken;
    try {
        console.log("The Token is "+token)
        decodedToken = jwt.verify(token, "somesupersecretkey");
        console.log(decodedToken)
    } catch (err) {
        console.log('reached here')
        req.isAuth = false;
        return next();
    }

    if(!decodedToken) {
        req.isAuth = false;
        console.log('Could not decode token');
        return next();
    }

    req.isAuth = true;
    req.user_email = decodedToken.user_email;
    console.log('Completed Successfully',req.isAuth);
    next();
}