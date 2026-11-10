// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/task_model.dart';
import '../providers/tasks_provider.dart';
import '../widgets/task_form_sheet.dart';

/// 列表排序方式（默认 = 服务端给定的顺序：sortOrder 升序、创建时间倒序）。
enum TaskSortMode { defaultOrder, priority, status, createdAt }

/// 任务页
class TasksPage extends StatefulWidget {
  const TasksPage({super.key});

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> {
  DateTime _selectedDate = DateTime.now();
  DateTime _visibleMonth = DateTime(DateTime.now().year, DateTime.now().month, 1);
  TaskSortMode _sortMode = TaskSortMode.defaultOrder;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) {
        context.read<TasksProvider>().load(date: _dateKey(_selectedDate));
      }
    });
  }

  String _dateKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _onAdd() async {
    final saved = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (_) => TaskFormSheet(
        title: context.l10n.tasksAddTitle,
        defaultDate: _selectedDate,
        onSubmit: (data) async {
          final provider = context.read<TasksProvider>();
          final ok = await provider.add({
            ...data,
            'status': 'todo',
            'approvalStatus': 'none',
          });
          if (!ok && context.mounted) {
            AppToast.error(
                context, provider.error ?? context.l10n.unknownError);
          }
          return ok;
        },
      ),
    );
    if (saved == true && mounted) {
      await context.read<TasksProvider>().load(date: _dateKey(_selectedDate));
    }
  }

  Future<void> _onToggleComplete(int id, bool isDone) async {
    final provider = context.read<TasksProvider>();
    final ok =
        isDone ? await provider.uncomplete(id) : await provider.complete(id);
    if (!ok && mounted) {
      AppToast.error(context, provider.error ?? context.l10n.unknownError);
    }
  }

  Future<void> _onApprove(int id, bool approve) async {
    final provider = context.read<TasksProvider>();
    final ok = approve ? await provider.approve(id) : await provider.reject(id);
    if (!ok && mounted) {
      AppToast.error(context, provider.error ?? context.l10n.unknownError);
    }
  }

  void _selectDate(DateTime date) {
    setState(() {
      _selectedDate = date;
      _visibleMonth = DateTime(date.year, date.month, 1);
    });
    context.read<TasksProvider>().load(date: _dateKey(date));
  }

  String _dayLabel() {
    final now = DateTime.now();
    final isToday = _selectedDate.year == now.year &&
        _selectedDate.month == now.month &&
        _selectedDate.day == now.day;
    return '${_selectedDate.month}月${_selectedDate.day}日${isToday ? ' · 今天' : ''}';
  }

  Color _priorityColor(String priority) {
    if (priority == 'high') return CupertinoColors.systemOrange;
    if (priority == 'low') return CupertinoColors.systemGreen;
    return CupertinoColors.systemBlue;
  }

  int _priorityRank(String priority) =>
      priority == 'high' ? 0 : (priority == 'medium' ? 1 : 2);

  int _statusRank(String status) {
    switch (status) {
      case 'todo':
        return 0;
      case 'doing':
        return 1;
      case 'done':
        return 2;
      default:
        return 3;
    }
  }

  /// 稳定排序：比较结果相同时保持服务端原顺序（List.sort 本身不稳定）。
  List<TaskModel> _sorted(List<TaskModel> items) {
    if (_sortMode == TaskSortMode.defaultOrder) return items;
    final order = <int, int>{
      for (var i = 0; i < items.length; i++) items[i].id: i,
    };
    final list = [...items];
    list.sort((a, b) {
      var result = 0;
      if (_sortMode == TaskSortMode.priority) {
        result =
            _priorityRank(a.priority).compareTo(_priorityRank(b.priority));
      } else if (_sortMode == TaskSortMode.status) {
        result = _statusRank(a.status).compareTo(_statusRank(b.status));
      } else if (_sortMode == TaskSortMode.createdAt) {
        final da = DateTime.tryParse(a.createdAt ?? '');
        final db = DateTime.tryParse(b.createdAt ?? '');
        result = da == null || db == null ? 0 : db.compareTo(da);
      }
      return result != 0 ? result : order[a.id]!.compareTo(order[b.id]!);
    });
    return list;
  }

  String _sortShortLabel(TaskSortMode mode) {
    final l10n = context.l10n;
    switch (mode) {
      case TaskSortMode.defaultOrder:
        return l10n.taskSortDefault;
      case TaskSortMode.priority:
        return l10n.taskSortPriority;
      case TaskSortMode.status:
        return l10n.taskSortStatus;
      case TaskSortMode.createdAt:
        return l10n.taskSortCreated;
    }
  }

  String _sortFullLabel(TaskSortMode mode) {
    final l10n = context.l10n;
    switch (mode) {
      case TaskSortMode.defaultOrder:
        return l10n.taskSortDefaultFull;
      case TaskSortMode.priority:
        return l10n.taskSortPriorityFull;
      case TaskSortMode.status:
        return l10n.taskSortStatusFull;
      case TaskSortMode.createdAt:
        return l10n.taskSortCreatedFull;
    }
  }

  Future<void> _pickSort() async {
    final selected = await showCupertinoModalPopup<TaskSortMode>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(context.l10n.taskSort),
        actions: TaskSortMode.values
            .map(
              (mode) => CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(ctx, mode),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (mode == _sortMode)
                      const Padding(
                        padding: EdgeInsets.only(right: 6),
                        child: Icon(CupertinoIcons.check_mark, size: 15),
                      ),
                    Text(_sortFullLabel(mode)),
                  ],
                ),
              ),
            )
            .toList(),
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: Text(context.l10n.cancel),
        ),
      ),
    );
    if (selected != null && selected != _sortMode) {
      setState(() => _sortMode = selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final provider = context.watch<TasksProvider>();
    final items = provider.items;
    final sortedItems = _sorted(items);
    final isParent = context.watch<AuthProvider>().user?.familyRole == 'parent';

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.tasksTitle),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          minimumSize: const Size(36, 36),
          onPressed: _onAdd,
          child: Icon(
            CupertinoIcons.add,
            size: 24,
            color: CupertinoTheme.of(context).primaryColor,
          ),
        ),
      ),
      child: Column(
        children: [
          _calendar(context),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _dayLabel(),
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(36, 28),
                      onPressed: _pickSort,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            CupertinoIcons.arrow_up_arrow_down,
                            size: 14,
                            color: CupertinoTheme.of(context).primaryColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _sortShortLabel(_sortMode),
                            style: TextStyle(
                                fontSize: 13,
                                color:
                                    CupertinoTheme.of(context).primaryColor),
                          ),
                        ],
                      ),
                    ),
                    if (!_dayLabel().endsWith('今天'))
                      CupertinoButton(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(36, 28),
                        onPressed: () => _selectDate(DateTime.now()),
                        child: Text('回到今天',
                            style: TextStyle(
                                fontSize: 13,
                                color:
                                    CupertinoTheme.of(context).primaryColor)),
                      ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: provider.loading && items.isEmpty
                ? const Center(child: CupertinoActivityIndicator())
                : items.isEmpty
                    ? _emptyState(context)
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: sortedItems.length,
                        itemBuilder: (_, i) => _taskCard(
                          context,
                          sortedItems[i],
                          i + 1,
                          isParent,
                          provider.unreadFor(sortedItems[i].id),
                          provider.changedFor(sortedItems[i].id),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _calendar(BuildContext context) {
    final theme = CupertinoTheme.of(context);
    final grey = CupertinoColors.systemGrey.resolveFrom(context);
    final first = DateTime(_visibleMonth.year, _visibleMonth.month, 1);
    final days = DateTime(_visibleMonth.year, _visibleMonth.month + 1, 0).day;
    final leading = first.weekday - 1;
    final rows = ((leading + days + 6) ~/ 7);
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
      decoration: BoxDecoration(
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              CupertinoButton(
                padding: EdgeInsets.zero,
                minimumSize: const Size(32, 32),
                onPressed: () => setState(() {
                  _visibleMonth = DateTime(
                      _visibleMonth.year, _visibleMonth.month - 1, 1);
                }),
                child: const Icon(CupertinoIcons.chevron_left, size: 18),
              ),
              Text(
                '${_visibleMonth.year}年${_visibleMonth.month}月',
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              CupertinoButton(
                padding: EdgeInsets.zero,
                minimumSize: const Size(32, 32),
                onPressed: () => setState(() {
                  _visibleMonth = DateTime(
                      _visibleMonth.year, _visibleMonth.month + 1, 1);
                }),
                child: const Icon(CupertinoIcons.chevron_right, size: 18),
              ),
            ],
          ),
          Row(
            children: weekdays
                .map((w) => Expanded(
                      child: Center(
                        child: Text(w,
                            style: TextStyle(fontSize: 12, color: grey)),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 4),
          ...List.generate(rows, (r) {
            return Row(
              children: List.generate(7, (c) {
                final index = r * 7 + c;
                final day = index - leading + 1;
                if (day < 1 || day > days) {
                  return const Expanded(child: SizedBox(height: 38));
                }
                final date =
                    DateTime(_visibleMonth.year, _visibleMonth.month, day);
                final selected = _selectedDate.year == date.year &&
                    _selectedDate.month == date.month &&
                    _selectedDate.day == date.day;
                final now = DateTime.now();
                final today = now.year == date.year &&
                    now.month == date.month &&
                    now.day == date.day;
                final weekend = date.weekday >= 6;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => _selectDate(date),
                    child: Container(
                      height: 38,
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: selected ? theme.primaryColor : null,
                        border: today && !selected
                            ? Border.all(color: theme.primaryColor.withAlpha(90))
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          '$day',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight:
                                selected ? FontWeight.w700 : FontWeight.w400,
                            color: selected
                                ? CupertinoColors.white
                                : (weekend ? grey : CupertinoColors.label),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            );
          }),
        ],
      ),
    );
  }

  Widget _emptyState(BuildContext context) {
    final theme = CupertinoTheme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            CupertinoIcons.smiley,
            size: 52,
            color: theme.primaryColor.withAlpha(120),
          ),
          const SizedBox(height: 12),
          Text(
            '这一天还没有任务',
            style: TextStyle(
              fontSize: 16,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '点右上角 + 创建一个吧',
            style: TextStyle(
              fontSize: 13,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _taskCard(
    BuildContext context,
    TaskModel item,
    int seq,
    bool isParent,
    int unread,
    int changed,
  ) {
    final l10n = context.l10n;
    final isDone = item.status == 'done';
    final needsApproval = item.approvalStatus == 'pending';
    final accent = _priorityColor(item.priority);
    final label = CupertinoColors.label.resolveFrom(context);
    final grey = CupertinoColors.systemGrey.resolveFrom(context);

    return GestureDetector(
      onTap: () async {
        await context.push('/tasks/${item.id}');
        // 详情页可能改了完成状态：回到列表时按当前选中日期重载。
        if (!context.mounted) return;
        await context.read<TasksProvider>().load(date: _dateKey(_selectedDate));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: accent.withAlpha(16),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: accent.withAlpha(36)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 20,
              child: Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  '$seq',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: grey,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _onToggleComplete(item.id, isDone),
              child: Container(
                width: 30,
                height: 30,
                margin: const EdgeInsets.only(top: 2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDone
                      ? CupertinoColors.activeGreen
                      : CupertinoColors.systemBackground.resolveFrom(context),
                  border: Border.all(
                    color: isDone ? CupertinoColors.activeGreen : accent,
                    width: 2,
                  ),
                ),
                child: isDone
                    ? const Icon(CupertinoIcons.check_mark,
                        size: 18, color: CupertinoColors.white)
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w700,
                      color: isDone ? grey : label,
                      decoration: isDone ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _pill(l10n.priorityLabel(item.priority), accent),
                      _pill(
                        l10n.enumLabel(item.status),
                        isDone
                            ? CupertinoColors.activeGreen
                            : CupertinoColors.systemBlue,
                      ),
                      if (needsApproval)
                        _pill(
                          l10n.enumLabel(item.approvalStatus),
                          CupertinoColors.systemOrange,
                        ),
                      if (unread > 0)
                        _pill(
                          l10n.newNotes(unread),
                          CupertinoColors.systemRed,
                        ),
                      if (changed > 0)
                        _pill(
                          l10n.taskUpdated,
                          CupertinoColors.systemBlue,
                        ),
                    ],
                  ),
                  if (isParent && needsApproval) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        CupertinoButton(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          minimumSize: const Size(0, 0),
                          color: CupertinoColors.activeGreen,
                          borderRadius: BorderRadius.circular(16),
                          onPressed: () => _onApprove(item.id, true),
                          child: Text(l10n.approve,
                              style: const TextStyle(
                                  fontSize: 13, color: CupertinoColors.white)),
                        ),
                        const SizedBox(width: 8),
                        CupertinoButton(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          minimumSize: const Size(0, 0),
                          color: CupertinoColors.destructiveRed,
                          borderRadius: BorderRadius.circular(16),
                          onPressed: () => _onApprove(item.id, false),
                          child: Text(l10n.reject,
                              style: const TextStyle(
                                  fontSize: 13, color: CupertinoColors.white)),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 6),
            Icon(CupertinoIcons.chevron_right, size: 18, color: grey),
          ],
        ),
      ),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(28),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: TextStyle(fontSize: 12, color: color)),
    );
  }
}
