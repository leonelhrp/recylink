export interface IUser {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface IAuthResponse {
  access_token: string;
  user: IUser;
}
