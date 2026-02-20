import * as users from "./users.fetcher";
import * as auth from "./auth.fetcher";

export const api = {
  ...users,
  ...auth,
};
