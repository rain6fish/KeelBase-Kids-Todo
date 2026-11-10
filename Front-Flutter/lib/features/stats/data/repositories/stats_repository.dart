// SPDX-License-Identifier: Apache-2.0

import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_response.dart';
import '../../../../core/errors/exceptions.dart';

class StatsRepository {
  final ApiClient _client;

  StatsRepository(this._client);

  Future<Map<String, dynamic>> _get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final json =
        await _client.get(path, queryParameters: queryParameters);
    final response = ApiResponse<Map<String, dynamic>>.fromJson(json, (data) {
      if (data is! Map) throw NetworkException('Unexpected stats response');
      return Map<String, dynamic>.from(data);
    });
    if (!response.isSuccess || response.data == null) {
      throw NetworkException(response.message);
    }
    return response.data!;
  }

  Future<Map<String, dynamic>> overview({String? date}) => _get(
        '/stats/overview',
        queryParameters: date == null ? null : {'date': date},
      );

  Future<Map<String, dynamic>> streak() => _get('/stats/streak');

  Future<List<Map<String, dynamic>>> completionRate({int days = 7}) async {
    final json = await _client.get('/stats/completion-rate',
        queryParameters: {'days': days});
    final response = ApiResponse<List<Map<String, dynamic>>>.fromJson(json, (data) {
      if (data is! List) throw NetworkException('Unexpected stats response');
      return data
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    });
    if (!response.isSuccess) throw NetworkException(response.message);
    return response.data ?? [];
  }
}
