import "express";

declare global {
  namespace Express {
    interface Request {
      email?: string;
      userId?: string;
    }
  }
}

export {};