export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  roles: Role[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  createdBy?: string;
  creator?: User;
  creatorOf: User[];
}

export enum Role {
  User = 'User',
  Admin = 'Admin',
  Moderator = 'Moderator',
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}
