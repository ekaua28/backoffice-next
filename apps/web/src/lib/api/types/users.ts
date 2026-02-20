export type UserDto = {
  id: string;
  firstName: string;
  lastName: string;
  status: "active" | "inactive";
  loginsCounter: number;
  creationTime: string;
  lastUpdateTime: string;
};
