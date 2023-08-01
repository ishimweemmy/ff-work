export class HTTPError extends Error {
  httpCode = 500;
  code = 'ERROR_SERVER_UNSPECIFIED_ERROR';

  constructor(message = 'Internal server error.', httpCode?: number) {
    super(message);
    if (httpCode) {
      this.httpCode = httpCode;
    }
  }
}

export class IncorrectCredentialsError extends HTTPError {
  httpCode = 401;
  code = 'ERROR_INCORRECT_CREDENTIALS';

  constructor(message = 'Credentials are incorrect.') {
    super(message);
  }
}

export class NotFoundError extends HTTPError {
  httpCode = 404;
  code = 'ERROR_NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class UnauthorizedError extends HTTPError {
  httpCode = 401;
  code = 'ERROR_UNAUTHORIZED';

  constructor(message = "Endpoint can't be used. The user has not signed in.") {
    super(message);
  }
}

export class UserMismatchError extends HTTPError {
  httpCode = 403;
  code = 'ERROR_USER_MISMATCH';

  constructor(
    message = "This resource belongs to another user. You can't access this."
  ) {
    super(message);
  }
}

export class FileMissingError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_FILE_MISSING';

  constructor(
    message = 'This API endpoint needs one or more file submission. ' +
      'Check whether you submitted the file in a wrong place or forget to.'
  ) {
    super(message);
  }
}

export class IncompleteDatasetError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_INCOMPLETE_DATASET';

  constructor(
    message = "Your dataset is incomplete, and therefore can't be processed."
  ) {
    super(message);
  }
}

export class InvalidArgumentsError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_INVALID_ARGUMENTS';

  constructor(
    message = 'Check the input structure for missing/invalid arguments.'
  ) {
    super(message);
  }
}

export class FileAttributeMissingError extends Error {}

export class InvalidOperationError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_INVALID_OPERATION';

  constructor(message = 'Invalid operation on resource.') {
    super(message);
  }
}

export class NoPaymentMethodError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_NO_PAYMENT_METHOD';

  constructor(
    message = 'This endpoint requires one payment method attached to the resource.'
  ) {
    super(message);
  }
}

export class AlreadyPaidError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_ALREADY_PAID';

  constructor(message = 'You have already paid for this service.') {
    super(message);
  }
}

export class AuthError extends Error {
  httpCode = 401;
  code = 'ERROR_UNAUTHORIZED';

  constructor(message = `Endpoint can't be used. The user has not signed in.`) {
    super(message);
  }
}

export class PrivateBetaError extends HTTPError {
  httpCode = 401;
  code = 'ERROR_PRIVATE_BETA';

  constructor(
    message = 'Flockfysh is in private beta. Please try again later!'
  ) {
    super(message);
  }
}

export class ImmutableResourceError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_IMMUTABLE_RESOURCE';

  constructor(message = 'Resource is immutable.') {
    super(message);
  }
}

export class AlreadyExistsError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_ALREADY_EXISTS';

  constructor(message = 'Resource has already existed.') {
    super(message);
  }
}

export class NotLikedError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_NOT_LIKED';

  constructor(message = 'You have not liked this dataset.') {
    super(message);
  }
}

export class AlreadyLikedError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_ALREADY_LIKED';

  constructor(message = 'You have already liked this dataset.') {
    super(message);
  }
}

export class PermissionError extends HTTPError {
  httpCode = 403
  code = 'ERROR_PERMISSION_DENIED'

  constructor (
    message = 'You do not have permissions to access this resource.'
  ) {
    super(message)
  }
}

export class PurchaseUnavailableError extends HTTPError {
  httpCode = 403
  code = 'ERROR_PURCHASE_AVAILABLE'

  constructor (
    message = 'You cannot create a purchase link - either the resource is freely accessible, ' +
    'is private, or you have been granted explicit permissions, or you have been blocked access.'
  ) {
    super(message)
  }
}

export class AlreadyFollowedError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_ALREADY_FOLLOWED';

  constructor(message = 'You have already followed this user.') {
    super(message);
  }
}

export class AlreadyUnfollowedError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_ALREADY_UNFOLLOWED';

  constructor(message = 'You have already unfollowed this user.') {
    super(message);
  }
}

export class UserFollowedByItselfError extends HTTPError {
  httpCode = 400;
  code = 'ERROR_USER_FOLLOWED_BY_ITSELF';

  constructor(message = 'You can not follow yourself.') {
    super(message);
  }
}
