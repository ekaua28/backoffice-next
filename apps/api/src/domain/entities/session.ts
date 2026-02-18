class SessionTerminatedError extends Error {
  constructor() {
    super("Session terminated.");
    this.name = "SessionTerminatedError";
  }
}

export interface SessionProps {
  id: string;
  userId: string;
  createdAt: string;
  terminatedAt: string | null;
}

/**
 * Session entity.
 */
export class Session {
  private constructor(private props: SessionProps) {}

  static SessionTerminatedError = SessionTerminatedError;

  static create(params: { id: string; userId: string; now: string }): Session {
    return new Session({
      id: params.id,
      userId: params.userId,
      createdAt: params.now,
      terminatedAt: null,
    });
  }

  static fromPersistence(row: SessionProps): Session {
    return new Session({ ...row });
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get terminatedAt() {
    return this.props.terminatedAt;
  }

  isActive() {
    return this.props.terminatedAt === null;
  }

  assertActive() {
    if (!this.isActive()) throw new SessionTerminatedError();
  }

  terminate(now: string) {
    if (this.props.terminatedAt) return;
    this.props.terminatedAt = now;
  }

  toPersistence(): SessionProps {
    return { ...this.props };
  }
}
