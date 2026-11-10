// SPDX-License-Identifier: Apache-2.0

import 'dart:async';

import 'package:flutter/foundation.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/services/app_cache.dart';
import '../../../sync/data/services/offline_sync_service.dart';
import '../../data/models/task_model.dart';
import '../../data/repositories/tasks_repository.dart';

/// 任务状态管理（UX-1：缓存优先 + 乐观更新）。
class TasksProvider extends ChangeNotifier {
  final TasksRepository _repository;
  final AppCache _cache;

  static const _ns = 'tasks';
  static const _keyList = 'list';

  List<TaskModel> _items = [];
  Map<int, int> _unread = const {};
  Map<int, int> _changed = const {};
  bool _loading = false;
  bool _fromCache = false;
  String? _error;
  bool _disposed = false;
  int _loadGeneration = 0;
  String _cacheKey = _keyList;

  final OfflineSyncService? _sync;

  TasksProvider(this._repository, {AppCache? cache, OfflineSyncService? sync})
      : _cache = cache ?? AppCache.unavailable(),
        _sync = sync;

  bool _isOffline(Object e) =>
      e is NetworkException ||
      e.toString().contains('SocketException') ||
      e.toString().contains('Connection') ||
      e.toString().contains('timed out');

  List<TaskModel> get items => List.unmodifiable(_items);
  int unreadFor(int taskId) => _unread[taskId] ?? 0;
  int changedFor(int taskId) => _changed[taskId] ?? 0;
  bool get loading => _loading;
  String? get error => _error;
  /// 当前数据是否来自离线缓存（网络未刷新成功）。
  bool get fromCache => _fromCache;

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> load({String? date}) async {
    final generation = ++_loadGeneration;
    _cacheKey = date == null ? _keyList : '${_keyList}_$date';
    _loading = true;
    _error = null;
    _notify();

    // 缓存优先：先展示本地缓存，避免空白。缓存读取失败不阻塞网络刷新。
    // Cache first: show the local copy so the list is never blank. A failed cache read must not
    // block the network refresh.
    try {
      final cached = await _cache.readList(_ns, _cacheKey);
      if (generation != _loadGeneration) return;
      if (cached != null) {
        _items = cached.map(TaskModel.fromJson).toList();
        _fromCache = true;
        _notify();
      }
    } catch (e) {
      if (generation != _loadGeneration) return;
      debugPrint('TasksProvider cache read failed: $e');
    }

    // 先把离线期间的写操作推给服务端，再拉最新列表；推送失败不阻塞读取。
    if (_sync != null) {
      await _sync.ensureRegistered();
      await _sync.flush();
    }

    try {
      final items = await _repository.getTasks(date: date);
      if (generation != _loadGeneration) return;
      _items = items;
      _fromCache = false;
      try {
        await _persist();
      } catch (e) {
        // 网络加载已成功，缓存写入失败不应视为加载失败。
        debugPrint('TasksProvider cache write failed: $e');
      }
      await refreshUnread();
    } catch (e) {
      if (generation != _loadGeneration) return;
      if (_items.isEmpty) _error = e.toString();
    } finally {
      if (generation == _loadGeneration) {
        _loading = false;
        _notify();
      }
    }
  }

  Future<bool> add(Map<String, dynamic> data) async {
    try {
      final item = await _repository.create(data);
      _items = [..._items, item];
      _error = null;
      _notify();
      try {
        await _persist();
      } catch (e) {
        // 网络创建已成功，缓存写入失败不应视为操作失败。
        debugPrint('TasksProvider cache write failed: $e');
      }
      return true;
    } catch (e) {
      if (_isOffline(e) && _sync != null) {
        await _sync.enqueue({
          'entityType': 'task',
          'action': 'insert',
          'payload': data,
        });
        try {
          final temp = TaskModel.fromJson({
            ...data,
            'id': -DateTime.now().millisecondsSinceEpoch,
          });
          _items = [..._items, temp];
          await _persist();
        } catch (_) {
          // 离线占位失败不影响入队；下次刷新会从服务端拿到真实记录
        }
        _error = null;
        _notify();
        return true;
      }
      _error = e.toString();
      _notify();
      return false;
    }
  }

  /// 乐观更新：本地立即移除，网络失败恢复原列表。
  Future<bool> remove(int id) async {
    final originalList = _items;
    _items = _items.where((e) => e.id != id).toList();
    _error = null;
    _notify();

    try {
      await _repository.delete(id);
      try {
        await _persist();
      } catch (e) {
        debugPrint('TasksProvider cache write failed: $e');
      }
      return true;
    } catch (e) {
      if (_isOffline(e) && _sync != null) {
        await _sync.enqueue({
          'entityType': 'task',
          'action': 'delete',
          'entityId': id,
        });
        await _persist();
        _error = null;
        _notify();
        return true;
      }
      _items = originalList;
      _error = e.toString();
      _notify();
      return false;
    }
  }

  /// 完成任务（服务端结算积分/打卡）；离线时入队并本地标记完成。
  Future<bool> complete(int id) async {
    try {
      final item = await _repository.complete(id);
      _replaceItem(item);
      return true;
    } catch (e) {
      if (_isOffline(e) && _sync != null) {
        await _sync.enqueue({
          'entityType': 'task',
          'action': 'complete',
          'entityId': id,
        });
        final index = _items.indexWhere((item) => item.id == id);
        if (index >= 0) {
          _items = [..._items];
          _items[index] = TaskModel.fromJson({
            ..._items[index].toJson(),
            'status': 'done',
          });
        }
        await _persist();
        _error = null;
        _notify();
        return true;
      }
      _error = e.toString();
      _notify();
      return false;
    }
  }

  /// 撤销完成（服务端回退积分/打卡）；离线队列只支持 complete，故不做离线入队。
  Future<bool> uncomplete(int id) async {
    try {
      final item = await _repository.uncomplete(id);
      _replaceItem(item);
      return true;
    } catch (e) {
      _error = e.toString();
      _notify();
      return false;
    }
  }

  void _replaceItem(TaskModel item) {
    final index = _items.indexWhere((e) => e.id == item.id);
    if (index >= 0) {
      _items = [..._items]..[index] = item;
    }
    _error = null;
    _notify();
    unawaited(_persist());
  }

  /// 家长审批通过
  Future<bool> approve(int id) => _runAction(() => _repository.approve(id));

  /// 家长驳回
  Future<bool> reject(int id) => _runAction(() => _repository.reject(id));

  Future<bool> _runAction(Future<TaskModel> Function() action) async {
    try {
      final item = await action();
      final index = _items.indexWhere((e) => e.id == item.id);
      if (index >= 0) {
        _items = [..._items]..[index] = item;
      }
      _error = null;
      _notify();
      try {
        await _persist();
      } catch (e) {
        debugPrint('TasksProvider cache write failed: $e');
      }
      return true;
    } catch (e) {
      _error = e.toString();
      _notify();
      return false;
    }
  }

  Future<void> refreshUnread() async {
    try {
      final unread = await _repository.getUnread();
      _unread = unread.notes;
      _changed = unread.changes;
      _notify();
    } catch (e) {
      debugPrint('TasksProvider unread load failed: $e');
    }
  }

  Future<void> markRead(int taskId) async {
    try {
      await _repository.markRead(taskId);
      _unread = Map<int, int>.from(_unread)..remove(taskId);
      _changed = Map<int, int>.from(_changed)..remove(taskId);
      _notify();
    } catch (e) {
      debugPrint('TasksProvider markRead failed: $e');
    }
  }

  Future<void> _persist() async {
    await _cache.writeList(_ns, _cacheKey, _items.map((e) => e.toJson()).toList());
  }
}
