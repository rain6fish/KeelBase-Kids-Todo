// SPDX-License-Identifier: Apache-2.0

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// 离线期间的本地变更队列（SharedPreferences + JSON）。
///
/// 只存「幂等、可重放」的操作：完成/删除/创建任务。冲突由服务端逐条回报，
/// 调用方保留未成功的条目，下一轮继续尝试。
class PendingOpsService {
  static const _key = 'sync_pending_ops_v1';

  Future<List<Map<String, dynamic>>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return [];
      return decoded
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> save(List<Map<String, dynamic>> ops) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(ops));
  }

  Future<void> enqueue(Map<String, dynamic> op) async {
    final ops = await load();
    ops.add(op);
    await save(ops);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
