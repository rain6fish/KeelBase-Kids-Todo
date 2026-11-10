// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/foundation.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/security/secure_storage_service.dart';
import '../repositories/sync_repository.dart';
import 'pending_ops_service.dart';

/// 离线同步：本地队列 + 服务端增量接口的统一入口。
///
/// 设计取舍：不做本地数据库镜像（框架 Flutter 已有 cache-first 列表缓存），
/// 只把「离线写」排队、恢复后按序推送；服务端以 family 为单位分发增量，
/// 客户端下次 load() 拉取最新列表即可收敛。
class OfflineSyncService {
  OfflineSyncService(ApiClient client, this._storage)
      : _repo = SyncRepository(client),
        _pending = PendingOpsService();

  final SecureStorageService _storage;
  final SyncRepository _repo;
  final PendingOpsService _pending;
  bool _registered = false;

  Future<String> _deviceId() => _storage.getOrCreateDeviceId();

  String get _platform {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      default:
        return 'web';
    }
  }

  Future<void> ensureRegistered() async {
    if (_registered) return;
    try {
      final deviceId = await _deviceId();
      await _repo.registerDevice(
        deviceId: deviceId,
        platform: _platform,
        deviceName: _platform,
      );
      _registered = true;
    } catch (e) {
      debugPrint('OfflineSync registerDevice failed: $e');
    }
  }

  Future<void> enqueue(Map<String, dynamic> change) async {
    await _pending.enqueue(change);
  }

  /// 推送队列；成功应用的条目移除，冲突/失败的保留等待下一轮。
  Future<bool> flush() async {
    final ops = await _pending.load();
    if (ops.isEmpty) return true;
    try {
      final deviceId = await _deviceId();
      final result = await _repo.push(deviceId: deviceId, changes: ops);
      final appliedIndices = <int>{};
      final rawResults = result['results'];
      if (rawResults is List) {
        for (final item in rawResults) {
          if (item is Map && item['status'] == 'applied' && item['index'] is int) {
            appliedIndices.add(item['index'] as int);
          }
        }
      }
      final remaining = <Map<String, dynamic>>[];
      for (var i = 0; i < ops.length; i++) {
        if (!appliedIndices.contains(i)) remaining.add(ops[i]);
      }
      await _pending.save(remaining);
      return remaining.isEmpty;
    } catch (e) {
      debugPrint('OfflineSync flush failed: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>?> pull(int since) async {
    try {
      final deviceId = await _deviceId();
      return await _repo.pull(since: since, deviceId: deviceId);
    } catch (e) {
      debugPrint('OfflineSync pull failed: $e');
      return null;
    }
  }

  Future<int> pendingCount() async => (await _pending.load()).length;
}
