import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const userInfo = await requestClient.get<UserInfo>('/user/info');
  return { ...userInfo, homePath: userInfo.homePath || '/overview' };
}

export interface UserProfileParams {
  avatar?: string;
  phone: string;
  realName: string;
  username: string;
}

export interface ChangePasswordParams {
  newPassword: string;
  oldPassword: string;
}

export interface OssSts {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  dir: string;
  host: string;
  region: string;
  stsToken: string;
}

export async function getOssStsApi() {
  return requestClient.get<OssSts>('/oss/sts');
}

export async function updateUserProfileApi(data: UserProfileParams) {
  return requestClient.put<boolean>('/user/profile', data);
}

export async function changePasswordApi(data: ChangePasswordParams) {
  return requestClient.put<boolean>('/user/password', data);
}
