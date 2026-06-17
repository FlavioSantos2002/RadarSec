export type UserRole = "viewer" | "moderator" | "director";

export interface SignupDto {
  email: string;
  fullname: string;
  password: string;
}

export type LoginDto = Omit<SignupDto, "fullname">;

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}