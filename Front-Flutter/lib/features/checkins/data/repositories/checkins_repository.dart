// SPDX-License-Identifier: Apache-2.0

import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_response.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/checkin_model.dart';

class CheckinsRepository {
  final ApiClient _client;

  CheckinsRepository(this._client);

  /// 校验统一响应成功（契约见 ApiResponse.isSuccess：code=HTTP 状态码，2xx 成功）。
  /// Check the shared envelope: success means an HTTP-status `code` in the 2xx range.
  void _requireSuccess(ApiResponse response) {
    if (!response.isSuccess) {
      throw NetworkException(response.message);
    }
  }

  Future<List<CheckinModel>> getCheckins() async {
    final json = await _client.get('/checkins');
    final response = ApiResponse.fromJson(json, (data) {
      // 形状不是预期的那种就是失败，不是空列表：静默返回 `[]` 会把一个坏掉的接口说成「没有记录」。
      // A shape we did not expect is a failure, not an empty list: returning `[]` silently would
      // report a broken endpoint as "no records".
      if (data is! List) {
        throw NetworkException('Unexpected response format for /checkins');
      }
      return data.map((e) => CheckinModel.fromJson(e as Map<String, dynamic>)).toList();
    });
    _requireSuccess(response);
    return response.data ?? [];
  }

  Future<CheckinModel> create(Map<String, dynamic> data) async {
    final json = await _client.post('/checkins', data: data);
    final response = ApiResponse.fromJson(json, (data) {
      if (data is! Map<String, dynamic>) {
        throw NetworkException('Unexpected response format for /checkins');
      }
      return CheckinModel.fromJson(data);
    });
    _requireSuccess(response);
    final item = response.data;
    if (item == null) {
      throw NetworkException('Create checkin failed: empty response');
    }
    return item;
  }

  Future<void> delete(int id) async {
    final json = await _client.delete('/checkins/$id');
    final response = ApiResponse.fromJson(json, (_) => null);
    _requireSuccess(response);
  }
}
