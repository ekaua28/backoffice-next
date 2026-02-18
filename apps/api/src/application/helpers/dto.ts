export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  status: "active" | "inactive";
  loginsCounter: number;
  creationTime: string;
  lastUpdateTime: string;
}

export interface SessionDto {
  id: string;
  userId: string;
  creationTime: string;
  terminationTime: string | null;
}
