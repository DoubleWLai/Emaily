const flash = require('connect-flash');
const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const keys = require('./config/keys');

//Those are js file
require('./models/User');
require('./models/Survey');
require('./services/passport');

mongoose.connect(keys.mongoURI);


const app = express();
//in Express, use means you use middleware, which is to process request before express receive it
//bodyparser is a npm module to hele express parse request as express can not parse the request
app.use(bodyParser.json());
app.use(
    cookieSession({
        //Cookie last for 30 days
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [keys.cookieKey]
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// get Routes
require('./routes/authRoutes')(app);
require('./routes/billingRoutes')(app);
require('./routes/surveyRoutes')(app);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));

    const path = require('path');
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// This is a good way to run your server in dev envirnment and deployment envirnment
const PORT = process.env.PORT || 5000
app.listen(PORT);







