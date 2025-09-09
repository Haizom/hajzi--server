/**
 * Standardized API response utilities
 */

export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, statusCode = 500, message = 'Internal server error', error = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
  }

  res.status(statusCode).json(response);
};

export const sendValidationError = (res, errors) => {
  res.status(400).json({
    status: 'fail',
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString()
  });
};

// Generic response function
export const sendResponse = (res, statusCode = 200, status = 'success', message = 'Success', data = null) => {
  res.status(statusCode).json({
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Default export for backward compatibility
export default sendResponse;