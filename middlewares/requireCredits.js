module.exports = (req, res, next) => {
    if (!req.user.credits < 1) {
      //return res.status(403).send({ error: 'Not enough credits! ' });
      next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect('/surveys');
  };