// SPDX-License-Identifier: Apache-2.0

import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_response.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/task_model.dart';

class TaskUnread {
  const TaskUnread({required this.notes, required this.changes});

  final Map<int, int> notes;
  final Map<int, int> changes;
}

class TasksRepository {
  final ApiClient _client;

  TasksRepository(this._client);

  /// 校验统一响应成功（契约见 ApiResponse.isSuccess：code=HTTP 状态码，2xx 成功）。
  /// Check the shared envelope: success means an HTTP-status `code` in the 2xx range.
  void _requireSuccess(ApiResponse response) {
    if (!response.isSuccess) {
      throw NetworkException(response.message);
    }
  }

  Future<List<TaskModel>> getTasks({String? date}) async {
    final json = await _client.get(
      '/tasks',
      queryParameters: date == null ? null : {'date': date},
    );
    final response = ApiResponse.fromJson(json, (data) {
      // 形状不是预期的那种就是失败，不是空列表：静默返回 `[]` 会把一个坏掉的接口说成「没有记录」。
      // A shape we did not expect is a failure, not an empty list: returning `[]` silently would
      // report a broken endpoint as "no records".
      if (data is! List) {
        throw NetworkException('Unexpected response format for /tasks');
      }
      return data.map((e) => TaskModel.fromJson(e as Map<String, dynamic>)).toList();
    });
    _requireSuccess(response);
    return response.data ?? [];
  }

  Future<TaskModel> create(Map<String, dynamic> data) async {
    final json = await _client.post('/tasks', data: data);
    final response = ApiResponse.fromJson(json, (data) {
      if (data is! Map<String, dynamic>) {
        throw NetworkException('Unexpected response format for /tasks');
      }
      return TaskModel.fromJson(data);
    });
    _requireSuccess(response);
    final item = response.data;
    if (item == null) {
      throw NetworkException('Create task failed: empty response');
    }
    return item;
  }

  /// 未读汇总：每个任务的新备注数 + 别人对该任务的未读变更数。
  Future<TaskUnread> getUnread() async {
    final json = await _client.get('/task_notes/unread');
    final response = ApiResponse<Map<String, dynamic>>.fromJson(json, (data) {
      if (data is! Map) throw NetworkException('Unexpected unread response');
      return Map<String, dynamic>.from(data);
    });
    _requireSuccess(response);
    final data = response.data ?? const <String, dynamic>{};
    return TaskUnread(
      notes: _counts(data['counts']),
      changes: _counts(data['changes']),
    );
  }

  Map<int, int> _counts(Object? raw) {
    if (raw is! Map) return const {};
    final counts = <int, int>{};
    raw.forEach((key, value) {
      final id = int.tryParse(key.toString());
      final n = value is num ? value.toInt() : int.tryParse('$value');
      if (id != null && n != null && n > 0) counts[id] = n;
    });
    return counts;
  }

  Future<void> markRead(int taskId) async {
    final json = await _client.post('/task_notes/read', data: {'taskId': taskId});
    final response = ApiResponse.fromJson(json, (_) => null);
    _requireSuccess(response);
  }

  Future<void> delete(int id) async {
    final json = await _client.delete('/tasks/$id');
    final response = ApiResponse.fromJson(json, (_) => null);
    _requireSuccess(response);
  }

  Future<TaskModel> _action(int id, String action) async {
    final json = await _client.patch('/tasks/$id/$action', data: const {});
    final response = ApiResponse.fromJson(json, (data) {
      if (data is! Map<String, dynamic>) {
        throw NetworkException('Unexpected response format for /tasks/$id/$action');
      }
      return TaskModel.fromJson(data);
    });
    _requireSuccess(response);
    final item = response.data;
    if (item == null) throw NetworkException('Task action failed: empty response');
    return item;
  }

  Future<TaskModel> complete(int id) => _action(id, 'complete');
  Future<TaskModel> uncomplete(int id) => _action(id, 'uncomplete');
  Future<TaskModel> approve(int id) => _action(id, 'approve');
  Future<TaskModel> reject(int id) => _action(id, 'reject');
}
