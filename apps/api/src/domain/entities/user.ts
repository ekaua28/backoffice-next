import { Credentials } from "../valueObjects";

export type UserStatus = "active" | "inactive";
export interface UserProps {
  id: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  loginsCounter: number;
  createdAt: string;
  updatedAt: string;
  credentials: Credentials;
}

class InactiveUserCannotCreateSessionError extends Error {
  constructor() {
    super("Inactive users cannot create sessions.");
    this.name = "InactiveUserCannotCreateSessionError";
  }
}

class InactiveUserCannotRenameError extends Error {
  constructor() {
    super("First and Last Name properties cannot be updated if the user is inactive.");
    this.name = "InactiveUserCannotRenameError";
  }
}

/**
 * User domain.
 */
export class User {
  private constructor(private props: UserProps) {}

  static InactiveUserCannotCreateSessionError = InactiveUserCannotCreateSessionError;
  static InactiveUserCannotRenameError = InactiveUserCannotRenameError;

  static create(params: {
    id: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
    credentials: Credentials;
    now: string;
  }): User {
    return new User({
      id: params.id,
      firstName: params.firstName,
      lastName: params.lastName,
      status: params.status,
      loginsCounter: 0,
      createdAt: params.now,
      updatedAt: params.now,
      credentials: params.credentials
    });
  }

  static fromPersistence(row: Omit<UserProps, "credentials"> & { passwordHash: string }): User {
    return new User({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      status: row.status,
      loginsCounter: row.loginsCounter,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      credentials: Credentials.fromHash(row.passwordHash)
    });
  }

  get id() { return this.props.id; }
  get firstName() { return this.props.firstName; }
  get lastName() { return this.props.lastName; }
  get status() { return this.props.status; }
  get loginsCounter() { return this.props.loginsCounter; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get credentials() { return this.props.credentials; }

  update(patch: { firstName?: string; lastName?: string; status?: UserStatus }, now: string) {
    if (this.props.status === "inactive" && (patch.firstName !== undefined || patch.lastName !== undefined)) {
      throw new InactiveUserCannotRenameError();
    }
    if (patch.firstName !== undefined) this.props.firstName = patch.firstName;
    if (patch.lastName !== undefined) this.props.lastName = patch.lastName;
    if (patch.status !== undefined) this.props.status = patch.status;
    this.props.updatedAt = now;
  }

  assertCanCreateSession() {
    if (this.props.status !== "active") throw new InactiveUserCannotCreateSessionError();
  }

  bumpLogin(now: string) {
    this.props.loginsCounter += 1;
    this.props.updatedAt = now;
  }

  toPersistence(): {
    id: string; firstName: string; lastName: string; status: UserStatus;
    loginsCounter: number; passwordHash: string; createdAt: string; updatedAt: string;
  } {
    return {
      id: this.props.id,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      status: this.props.status,
      loginsCounter: this.props.loginsCounter,
      passwordHash: this.props.credentials.toHash(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
  }
}
