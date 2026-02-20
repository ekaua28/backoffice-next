import { UserDto } from "./users";

export type AuthResponse = {
  id: string;
  user: UserDto;
};
