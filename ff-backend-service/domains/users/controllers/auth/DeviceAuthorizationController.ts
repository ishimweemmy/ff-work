import { UnauthorizedError } from '../../../../utils/errors';
import OAuthInstance from '../../models/OAuthInstanceModel';
import OAuthAccessToken from '../../models/OAuthAccessTokenModel';
import mongoose from 'mongoose';
import OAuthClient from '../../models/OAuthClientModel';
import express from 'express';
import z from 'zod';

const OAUTH_INSTANCE_LIFESPAN = 900 * 1000;

export async function createOAuthInstance(
  request: express.Request,
  response: express.Response
) {
  const scope = z.string().parse(request.query.scope).split(' ');
  const clientId = z.string().parse(request.query.client_id);
  const client = await OAuthClient.findById(clientId);
  if (!client) {
    throw new UnauthorizedError('A client with this ID does not exist.');
  }
  const newAuthorizationInstance = await OAuthInstance.create({
    scope: scope,
    client: new mongoose.Types.ObjectId(clientId),
  });
  response.json({
    success: true,
    data: {
      ...newAuthorizationInstance.toJSON(),
      url: `${process.env.CORS_ORIGIN}/login?code=${newAuthorizationInstance.user_code}`,
    },
  });
}

export async function privateGetOAuthInstance(
  request: express.Request,
  response: express.Response
) {
  const deviceCode = z.string().parse(request.query.device_code);
  const currentInstance = await OAuthInstance.findOne({
    device_code: deviceCode,
  });
  if (!currentInstance) {
    throw new UnauthorizedError(
      'This authorization instance does not exist, has been rejected, or has expired.'
    );
  }
  if (Date.now() - +currentInstance.created_at > OAUTH_INSTANCE_LIFESPAN) {
    currentInstance.state = 'expired';
    await currentInstance.save();
  }
  // The access token will only be obtained once, after that, the instance is deleted for good.
  if (currentInstance.state !== 'pending') {
    await currentInstance.delete();
  }
  if (currentInstance.state === 'approved') {
    const tokenInfo = await OAuthAccessToken.findOne({
      access_token: currentInstance.access_token,
    });
    response.json({
      success: true,
      data: {
        access_token: tokenInfo,
        state: currentInstance.state,
      },
    });
  } else {
    response.json({
      success: true,
      data: {
        state: currentInstance.state,
      },
    });
  }
}

export async function publicGetOAuthInstance(
  request: express.Request,
  response: express.Response
) {
  const userCode = z.string().parse(request.query.user_code);
  const currentInstance = await OAuthInstance.findOne(
    {
      user_code: userCode,
    },
    {
      access_token: 0,
      device_code: 0,
    }
  ).populate('client');
  if (!currentInstance) {
    throw new UnauthorizedError('This authorization instance does not exist.');
  }
  response.json({
    success: true,
    data: currentInstance,
  });
}

export async function acceptOAuthInstance(
  request: express.Request,
  response: express.Response
) {
  const userCode = request.query.user_code;
  const currentInstance = await OAuthInstance.findOne({
    user_code: userCode,
  });
  if (!currentInstance) {
    throw new UnauthorizedError('This authorization instance does not exist.');
  }
  if (Date.now() - +currentInstance.created_at > OAUTH_INSTANCE_LIFESPAN) {
    currentInstance.state = 'expired';
    await currentInstance.save();
    throw new UnauthorizedError('This authorization instance has expired.');
  }
  if (!request.user) {
    throw new UnauthorizedError('User has not logged in.');
  }
  const newAccessToken = await OAuthAccessToken.create({
    client: currentInstance.client,
    user: request.user._id,
    scope: currentInstance.scope,
    ip_address: request.socket.remoteAddress,
  });
  currentInstance.access_token = newAccessToken.access_token;
  currentInstance.state = 'approved';
  await currentInstance.save();
  response.json({
    success: true,
  });
}

export async function rejectOAuthInstance(
  request: express.Request,
  response: express.Response
) {
  const userCode = request.query.user_code;
  const currentInstance = await OAuthInstance.findOne({
    user_code: userCode,
  });
  if (!currentInstance) {
    throw new UnauthorizedError(
      'This authorization instance does not exist, has been expire' +
        'd, or has been rejected.'
    );
  }
  currentInstance.state = 'rejected';
  await currentInstance.save();
  response.json({
    success: true,
  });
}
