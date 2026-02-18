import argon2 from "argon2";

class SessionTerminatedError extends Error {
  constructor() {
    super("Password must be at least 6 characters.");
    this.name = "SessionTerminatedError";
  }
}

/**
 * Credentials value object (encapsulates hashing/verifying).
 */
export class Credentials {
  private constructor(private readonly passwordHash: string) {}

  static fromHash(passwordHash: string): Credentials {
    return new Credentials(passwordHash);
  }

  static async fromPlainPassword(password: string): Promise<Credentials> {
    if (password.length < 6) throw new SessionTerminatedError();
    const hash = await argon2.hash(password);
    return new Credentials(hash);
  }

  async verify(password: string): Promise<boolean> {
    return argon2.verify(this.passwordHash, password);
  }

  toHash(): string {
    return this.passwordHash;
  }
}
