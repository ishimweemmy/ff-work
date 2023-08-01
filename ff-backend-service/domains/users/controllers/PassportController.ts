import googleStrategy from './GoogleController';
import User from '@/domains/users/models/UserModel';
import session from 'express-session';
import * as config from '@/utils/config';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import githubStrategy from './GithubController';
import { Express } from 'express';

function activatePassport(app: Express) {
  app.use(session(config.SESSION));
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  passport.use(githubStrategy);
  passport.use(googleStrategy);
  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });
  passport.deserializeUser((id, done) => {
    User.findById(id, (err?: Error | null, user?: Express.User | null) => {
      return done(err, user);
    });
  });
}

export default activatePassport;
