export const UserStatus = {
  Active: "active",
  Inactive: "inactive",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export function isUserStatusGuard(v: unknown): v is UserStatus {
  return v === UserStatus.Active || v === UserStatus.Active;
}