// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../providers/stats_provider.dart';

/// 小计划首页：今天的完成进度 + 积分/连签 + 任务清单。
class TodayPage extends StatefulWidget {
  const TodayPage({super.key});

  @override
  State<TodayPage> createState() => _TodayPageState();
}

class _TodayPageState extends State<TodayPage> {
  String get _todayKey {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      context.read<StatsProvider>().load(date: _todayKey);
      context.read<TasksProvider>().load(date: _todayKey);
    });
  }

  Future<void> _refresh() async {
    await Future.wait([
      context.read<StatsProvider>().load(date: _todayKey),
      context.read<TasksProvider>().load(date: _todayKey),
    ]);
  }

  Future<void> _toggle(int id, bool isDone) async {
    final provider = context.read<TasksProvider>();
    final ok =
        isDone ? await provider.uncomplete(id) : await provider.complete(id);
    if (!ok && mounted) {
      AppToast.error(context, provider.error ?? context.l10n.unknownError);
    } else if (mounted) {
      await _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final stats = context.watch<StatsProvider>();
    final tasksProvider = context.watch<TasksProvider>();
    final items = tasksProvider.items;
    final total = (stats.overview['total'] as num?)?.toInt() ?? items.length;
    final done = (stats.overview['done'] as num?)?.toInt() ??
        items.where((e) => e.status == 'done').length;
    final rate = total > 0 ? done / total : 0.0;
    final points = (stats.overview['points'] as num?)?.toInt() ?? 0;
    final streak = (stats.streak['currentStreak'] as num?)?.toInt() ?? 0;
    final today = DateTime.now();
    final dateText = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.todayTitle),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          minimumSize: const Size(36, 36),
          onPressed: _refresh,
          child: const Icon(CupertinoIcons.refresh, size: 22),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: LinearGradient(
                  colors: [
                    CupertinoTheme.of(context).primaryColor,
                    CupertinoTheme.of(context).primaryColor.withAlpha(180),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(dateText,
                      style: TextStyle(
                          color: CupertinoColors.white.withAlpha(180),
                          fontSize: 13)),
                  const SizedBox(height: 6),
                  Text(
                    '$done / $total  ${l10n.todayProgress}',
                    style: const TextStyle(
                        color: CupertinoColors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Stack(
                      children: [
                        Container(
                            height: 8,
                            color: CupertinoColors.white.withAlpha(60)),
                        FractionallySizedBox(
                          widthFactor: rate.clamp(0.0, 1.0),
                          child: Container(
                              height: 8, color: CupertinoColors.white),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _Metric(
                          icon: CupertinoIcons.star_fill,
                          value: '$points',
                          label: l10n.pointsLabel),
                      const SizedBox(width: 24),
                      _Metric(
                          icon: CupertinoIcons.flame,
                          value: '$streak',
                          label: l10n.streakDays),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              l10n.todayTasks,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            if (items.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Text(
                    l10n.noTasksToday,
                    style: const TextStyle(color: CupertinoColors.systemGrey),
                  ),
                ),
              )
            else
              ...items.map((item) {
                final isDone = item.status == 'done';
                final unread = tasksProvider.unreadFor(item.id);
                final changed = tasksProvider.changedFor(item.id);
                return GestureDetector(
                  onTap: () async {
                    await context.push('/tasks/${item.id}');
                    // 详情页可能改了完成状态：回来时列表与顶部数字一起重载。
                    if (mounted) await _refresh();
                  },
                  child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: CupertinoListTile(
                    leading: CupertinoButton(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(28, 28),
                      onPressed: () => _toggle(item.id, isDone),
                      child: Icon(
                        isDone
                            ? CupertinoIcons.check_mark_circled_solid
                            : CupertinoIcons.circle,
                        size: 24,
                        color: isDone ? CupertinoColors.activeGreen : null,
                      ),
                    ),
                    title: Text(
                      item.title,
                      style: isDone
                          ? const TextStyle(
                              decoration: TextDecoration.lineThrough,
                              color: CupertinoColors.systemGrey,
                            )
                          : null,
                    ),
                    subtitle: Text(
                      '${l10n.priorityLabel(item.priority)} · ${l10n.enumLabel(item.status)}'
                      '${unread > 0 ? ' · ${l10n.newNotes(unread)}' : ''}'
                      '${changed > 0 ? ' · ${l10n.taskUpdated}' : ''}',
                      style: unread > 0
                          ? const TextStyle(color: CupertinoColors.systemRed)
                          : null,
                    ),
                  ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: CupertinoColors.white.withAlpha(180)),
        const SizedBox(width: 6),
        Text(value,
            style: const TextStyle(
                color: CupertinoColors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700)),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                color: CupertinoColors.white.withAlpha(180), fontSize: 13)),
      ],
    );
  }
}
