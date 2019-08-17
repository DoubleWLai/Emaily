const _ = require('lodash');
const Path = require('path-parser');
const { URL } = require('url'); // which is default module in node.js
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

const Survey = mongoose.model('surveys');

//the requireLogin don't have () because we are not calling it, just excute the code one by one
//we can add as many as middleware as we want
module.exports = app => {
  app.get('/api/surveys', requireLogin, async (req, res) => {
    const surveys = await Survey.find({ _user: req.user.id }).select({
      recipients: false
    });

    res.send(surveys);
  });
  

  app.get('/api/surveys/:surveyId/:choice', (req, res) => {
    res.send('Thanks for voting');
  });


  app.post('/api/surveys/webhooks', (req, res) => {
    const p = new Path('/api/surveys/:surveyId/:choice'); //this is a matcher

    _.chain(req.body)
      .map(({ email, url }) => {
        const match = p.test(new URL(url).pathname); // new URL(url).pathname return the whole url, p.test(xx) return the matched id and choice
        if (match) { //if match is not null
          return { email, surveyId: match.surveyId, choice: match.choice };
        }
      })
      .compact() //remove undefined array elements
      .uniqBy('email', 'surveyId') //remove duplicated array elements
      .each(({ surveyId, email, choice }) => {
        Survey.updateOne( //the first argument is to find the right data in mongo, the second is to update it
          {
            _id: surveyId, // used _id not id as this is mongodb syntax
            recipients: {
              $elemMatch: { email: email, responded: false }
            }
          },
          {
            $inc: { [choice]: 1 },
            $set: { 'recipients.$.responded': true },
            lastResponded: new Data()
          }
        ).exec();//send to database to execute this updateone function
      })
      .value();
  });



  app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
    const { title, subject, body, recipients } = req.body;

    const survey = new Survey({
      title,
      subject,
      body,
      recipients: recipients.split(',').map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now()
    });

    // Send email
    const mailer = new Mailer(survey, surveyTemplate(survey));

    try {
      await mailer.send();
      await survey.save();

      // Minus 1 credit after email is sent
      req.user.credits -= 1;
      const user = await req.user.save();

      res.send(user);
    } catch (err) {
      res.status(422).send(err);
    }
  });
};
