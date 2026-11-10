// SPDX-License-Identifier: Apache-2.0

export interface TaskNoteItem {
  id: number
  taskId: number
  content: string
  contentType: string
  mediaUrl: string
  createdAt: string
}

export interface CreateTaskNoteRequest {
  taskId: number;
  content: string;
  contentType: string;
  mediaUrl: string;
}
