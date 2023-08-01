// Initialize a class that forces the user to log in and exposes userId to its methods.
import { UnauthorizedError } from '../errors'
import mongoose from 'mongoose'
import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import express from 'express'

export default abstract class AbstractService {
  user: Express.User
  repo?: AbstractRepository

  constructor (user: Express.User) {
    if (!user) {
      throw new UnauthorizedError('You have not signed in.')
    }
    this.user = user
  }
}
