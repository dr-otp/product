import { Role } from 'src/common';

export const hasRoles = (userRoles: Role[], validRoles: Role[]) => {
  return userRoles.some((role) => validRoles.includes(role));
};
