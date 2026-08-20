// ─────────────────────────────────────────────────────────────
// Application Error Hierarchy
// ─────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  // Auth
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'USER_ALREADY_EXISTS'
  // Medications
  | 'MEDICATION_NOT_FOUND'
  | 'MEDICATION_FORBIDDEN'
  // Doses
  | 'DOSE_NOT_FOUND'
  | 'DOSE_ALREADY_RECORDED'
  // Prescriptions
  | 'PRESCRIPTION_NOT_FOUND'
  | 'PRESCRIPTION_PROCESSING_FAILED'
  | 'FILE_TOO_LARGE'
  | 'FILE_TYPE_NOT_ALLOWED'
  // AI
  | 'AI_EXTRACTION_FAILED'
  | 'OCR_FAILED'
  // Caregivers
  | 'CAREGIVER_NOT_FOUND'
  | 'CAREGIVER_ALREADY_EXISTS'
  | 'INVITATION_NOT_FOUND'
  | 'INVITATION_EXPIRED';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(code: ErrorCode = 'UNAUTHORIZED', message = 'Authentication required') {
    super(code, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode = 'NOT_FOUND', message = 'Resource not found') {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode = 'CONFLICT', message: string) {
    super(code, message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super('BAD_REQUEST', message, 400, details);
  }
}
