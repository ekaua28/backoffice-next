export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest: (msg: string) => new AppError(msg, 400),
  unauthorized: (msg: string) => new AppError(msg, 401),
  forbidden: (msg: string) => new AppError(msg, 403),
  notFound: (msg: string) => new AppError(msg, 404),
  conflict: (msg: string) => new AppError(msg, 409)
};
