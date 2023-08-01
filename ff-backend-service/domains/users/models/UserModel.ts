import mongoose, { Document, Error, mongo, PassportLocalDocument, PassportLocalModel } from 'mongoose'
import passportLocalMongoose from 'passport-local-mongoose'
import createStripeCustomer from '@/domains/payments/services/createStripeCustomer'
import { ObjectId } from '@/utils/abbreviations'
import { generate } from 'otp-generator'
import z from 'zod'
import { InvalidArgumentsError } from '@/utils/errors'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'

const Schema = mongoose.Schema

export interface IEmailVerification {
  verified: boolean;
  newEmail?: string;
  verificationCode?: string;
}

export interface IUserPhotoSchema {
  assetKey: string;
  url: string;
}

export interface ILinksSchema {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface IUser extends PassportLocalDocument {
  _id: ObjectId;
  email: string;
  verification: IEmailVerification;
  firstName?: string;
  lastName?: string;
  fullName: string;
  username: string;
  profilePhoto?: IUserPhotoSchema;
  headerPhoto?: IUserPhotoSchema;
  password?: string;
  provider: string;
  lastVisited: Date;
  tier: string;
  hash?: string;
  salt?: string;
  followers?: ObjectId[];
  followings?: ObjectId[];
  links?: ILinksSchema;
}

export const EmailVerificationSchema = new mongoose.Schema<IEmailVerification>({
  newEmail: {
    type: String,
    validate: {
      validator (email: string) {
        z.string().email().parse(email)
        return true
      }
    }
  },
  verificationCode: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  }
})

export const UserPhotoSchema = new Schema<IUserPhotoSchema>({
  assetKey: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  }
})

export const UserLinksSchema = new Schema<ILinksSchema>({
  github: {
    type: String,
    required: false
  },
  linkedin: {
    type: String,
    required: false
  },
  twitter: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false
  }
})

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    index: {
      unique: true,
      collation: {
        locale: 'en_US',
        strength: 2,
      }
    },
    validate: {
      validator (email: string) {
        z.string().email().parse(email)
        return true
      }
    }
  },
  verification: {
    type: EmailVerificationSchema,
    required: true,
    default: function (this: IUser) {
      return {
        newEmail: this.email,
        verificationCode: generate(8, {
          digits: true,
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
        })
      }
    },
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  fullName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: function (this: IUser) {
      return `user_${this._id.toString()}`
    },
    validate: function (data: string) {
      return /[A-Z0-9\-_]/i.test(data)
    },
    index: {
      unique: true,
      collation: {
        locale: 'simple',
        strength: 2,
      }
    }
  },
  profilePhoto: UserPhotoSchema,
  headerPhoto: UserPhotoSchema,
  password: String,
  provider: {
    type: String,
    required: [true, 'source not specified'],
  },
  lastVisited: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
  tier: {
    type: String,
    required: true,
    default: 'free',
  },
  followers: {
    type: Array<ObjectId>,
    required: false
  },
  followings: {
    type: Array<ObjectId>,
    required: false
  },
  links: UserLinksSchema
})

interface UserModel<T> extends PassportLocalModel<T>, MongooseCursorPaginationModel<T> {}

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  passwordField: 'password',
})

userSchema.set('toJSON', {
  virtuals: true,
})

userSchema.post('save', (err: Error, user: unknown, next: mongoose.Callback) => {
  if (err instanceof mongoose.mongo.MongoServerError) {
    if (err.code === 11000) {
      if (err.keyPattern.username) return next(new InvalidArgumentsError('Username already chosen!'), undefined)
      if (err.keyPattern.email) return next(new InvalidArgumentsError('Email already chosen!'), undefined)
    }
  }
  next(err, user)
})

userSchema.index({ email: 'text', fullName: 'text' }, {
  name: 'text_search',
})

userSchema.plugin(MongoPaging.mongoosePlugin)


const User: UserModel<IUser> = mongoose.model<IUser, UserModel<IUser>>('User', userSchema)
User.syncIndexes().then();

export default User
