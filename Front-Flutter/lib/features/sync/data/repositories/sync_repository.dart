// SPDX-License-Identifier: Apache-2.0

import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_response.dart';
import '../../../../core/errors/exceptions.dart';

class SyncRepository {
  final ApiClient _client;

  SyncRepository(this._client);

  Map<String, dynamic> _unwrap(Map<String, dynamic> json) {
    final response = ApiResponse<Map<String, dynamic>>.fromJson(json, (data) {
      if (data is! Map) throw NetworkException('Unexpected sync response');
      return Map<String, dynamic>.from(data);
    });
    if (!response.isSuccess || response.data == null) {
      throw NetworkException(response.message);
    }
    return response.data!;
  }

  Future<Map<String, dynamic>> registerDevice({
    required String deviceId,
    String? deviceName,
    String? platform,
  }) async {
    final json = await _client.post('/sync/register-device', data: {
      'deviceId': deviceId,
      'deviceName': ?deviceName,
      'platform': ?platform,
    });
    return _unwrap(json);
  }

  Future<Map<String, dynamic>> push({
    required String deviceId,
    required List<Map<String, dynamic>> changes,
  }) async {
    final json = await _client.post('/sync/push', data: {
      'deviceId': deviceId,
      'changes': changes,
    });
    return _unwrap(json);
  }

  Future<Map<String, dynamic>> pull({
    required int since,
    required String deviceId,
    int limit = 200,
  }) async {
    final json = await _client.get('/sync/changes', queryParameters: {
      'since': since,
      'limit': limit,
      'deviceId': deviceId,
    });
    return _unwrap(json);
  }
}
