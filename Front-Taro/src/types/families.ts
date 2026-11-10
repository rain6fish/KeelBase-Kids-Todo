// SPDX-License-Identifier: Apache-2.0

export interface FamilieItem {
  id: number
  name: string
  inviteCode: string
  approvalMode: boolean
  useTimeStart: string
  useTimeEnd: string
  createdAt: string
}

export interface CreateFamilieRequest {
  name: string;
  inviteCode: string;
  approvalMode: boolean;
  useTimeStart: string;
  useTimeEnd: string;
}
