class AppError extends Error {
  constructor(code, message, statusCode = 400, params = undefined) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    if (params) this.params = params;
  }
}

module.exports = AppError;
