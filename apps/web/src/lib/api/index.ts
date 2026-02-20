import * as users from "./users.fetcher";
import * as auth from "./auth.fetcher";

export type * from "./types"

export const api = {
  ...users,
  ...auth,
};
