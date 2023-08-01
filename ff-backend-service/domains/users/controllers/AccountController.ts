import BetaUser from '@/domains/users/models/BetaUserModel';
import express from 'express'

export async function addEmailToBetaWaitlist(request: express.Request, response: express.Response) {
  const betaUser = await BetaUser.findOne({
    email: request.body.email,
  });
  if (!betaUser) {
    await BetaUser.create({
      email: request.body.email,
    });
  }
  response.json({
    success: true,
  });
}

export function getCurrentUser(request: express.Request, response: express.Response) {
  const user = request.user;
  if (!user) {
    return response.json({
      success: true,
      data: {
        loggedIn: false,
        curUser: null,
      },
    });
  }
  response.json({
    success: true,
    data: {
      loggedIn: true,
      curUser: user,
    },
  });
}

export function successfulAuth(request: express.Request, response: express.Response) {
  response.render('successAuth.ejs', {
    data: JSON.stringify({
      success: true,
    }),
    originUrl: process.env.CORS_ORIGIN,
  });
}

export function failedAuth(request: express.Request, response: express.Response) {
  response.render('failedAuth.ejs', {
    data: JSON.stringify({
      success: false,
    }),
    originUrl: process.env.CORS_ORIGIN,
  });
}

export async function signOut(request: express.Request, response: express.Response) {
  await new Promise<void>((resolve, reject) => {
    request.logOut((error) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
  response.json({
    success: true,
  });
  request.session?.destroy(() => {});
}
