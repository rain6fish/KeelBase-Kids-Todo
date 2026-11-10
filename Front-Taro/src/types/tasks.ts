// SPDX-License-Identifier: Apache-2.0

export interface TaskItem {
  id: number
  title: string
  description: string
  priority: string
  status: string
  taskDate?: string
  estimatedMinutes?: number
  repeatRule: string
  approvalStatus: string
  helpRequested: boolean
  helpRequestNote: string
  sortOrder?: number
  createdAt: string
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: string;
  status: string;
  taskDate?: string;
  estimatedMinutes?: number;
  repeatRule: string;
  approvalStatus: string;
  helpRequested: boolean;
  helpRequestNote: string;
  sortOrder?: number;
}
