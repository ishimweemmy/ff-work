import User from '@/domains/users/models/UserModel'
import { HTTPError, InvalidArgumentsError, UnauthorizedError } from '@/utils/errors'
import express from 'express'
import signUpFunc from '@/domains/users/services/signUp'
import z from 'zod'

export async function signUp (req: express.Request, res: express.Response) {
  if (!req.body.fullName) {
    const error = new InvalidArgumentsError("Full name is missing.");
    error.code = "ERROR_MISSING_NAME";
    throw error;
  }
  if (!req.body.password) {
    const error = new InvalidArgumentsError("Password is missing")
    error.code = 'ERROR_INVALID_ARGUMENTS'
    throw error
  }
  try {
    z.string().email().parse(req.body.email)
  } catch (e) {
    const error = new InvalidArgumentsError("Email is invalid.");
    error.code = "ERROR_INVALID_EMAIL";
    throw error;
  }
  const newUser = await signUpFunc({
    fullName: req.body.fullName,
    email: req.body.email,
    provider: 'local',
    password: req.body.password,
  })

  await new Promise<void>((resolve, reject) => req.login(newUser, function (err) {
    if (err) reject(new HTTPError(err.message))
    res.send({
      success: true, data: newUser,
    })
    resolve()
  }))
}

export async function signIn (req: express.Request, res: express.Response) {
  if (!req.body.password) throw new UnauthorizedError('Missing password')
  const candidateUser = new User({
    email: req.body.email,
    password: req.body.password,
  })

  const { error, user } = await candidateUser.authenticate(req.body.password)

  if (error) {
    const mapping: Record<string, { message: string, code: string }> = {
      IncorrectUsernameError: { message: 'Incorrect email or password.', code: 'ERROR_INVALID_CREDENTIALS' },
      IncorrectPasswordError: { message: 'Incorrect email or password.', code: 'ERROR_INVALID_CREDENTIALS' },
      MissingUsernameError: { message: 'Missing email.', code: 'ERROR_MISSING_CREDENTIALS' },
      MissingPasswordError: {
        message: 'Missing password. Password should be at least 8 characters long.',
        code: 'ERROR_MISSING_CREDENTIALS'
      },
      NoSaltValueStoredError: {
        message: 'You haven\'t added a password to this account. Please try logging in with Google or GitHub.',
        code: 'ERROR_OAUTH_ACCOUNT_WITHOUT_PASSWORD'
      },
      NoHashValueStoredError: {
        message: 'You haven\'t added a password to this account. Please try logging in with Google or GitHub.',
        code: 'ERROR_OAUTH_ACCOUNT_WITHOUT_PASSWORD'
      },
    }
    const errData = mapping[error.name]
    if (errData) {
      const toThrow = new UnauthorizedError(errData.message)
      toThrow.code = errData.code
      throw toThrow
    }
    throw error
  }

  req.login(user, function () {
    return res.send({
      success: true, data: user
    })
  })
}

