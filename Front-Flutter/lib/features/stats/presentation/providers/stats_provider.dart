// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/foundation.dart';
import '../../data/repositories/stats_repository.dart';

class StatsProvider extends ChangeNotifier {
  StatsProvider(this._repository);

  final StatsRepository _repository;

  Map<String, dynamic> _overview = const {};
  Map<String, dynamic> _streak = const {};
  bool _loading = false;
  String? _error;
  bool _disposed = false;

  Map<String, dynamic> get overview => _overview;
  Map<String, dynamic> get streak => _streak;
  bool get loading => _loading;
  String? get error => _error;

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  /// [date] 为本地日期（`YYYY-MM-DD`），与任务列表查询同一天，保证顶部数字与列表口径一致。
  Future<void> load({String? date}) async {
    _loading = true;
    _error = null;
    if (!_disposed) notifyListeners();
    try {
      final results = await Future.wait([
        _repository.overview(date: date),
        _repository.streak(),
      ]);
      _overview = results[0];
      _streak = results[1];
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      if (!_disposed) notifyListeners();
    }
  }
}
