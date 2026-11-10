// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../providers/checkins_provider.dart';

/// 打卡页
class CheckinsPage extends StatefulWidget {
  const CheckinsPage({super.key});

  @override
  State<CheckinsPage> createState() => _CheckinsPageState();
}

class _CheckinsPageState extends State<CheckinsPage> {
  final _checkDateCtrl = TextEditingController();
  final _totalTasksCtrl = TextEditingController();
  final _doneTasksCtrl = TextEditingController();
  bool _isPerfectVal = false;
  final _pointsEarnedCtrl = TextEditingController();



  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) context.read<CheckinsProvider>().load();
    });
  }

  @override
  void dispose() {
    _checkDateCtrl.dispose();
    _totalTasksCtrl.dispose();
    _doneTasksCtrl.dispose();
    _pointsEarnedCtrl.dispose();
    super.dispose();
  }

  Future<void> _onAdd() async {
    final l10n = context.l10n;
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: CupertinoActionSheet(
          title: Text(l10n.checkinsAddTitle),
          message: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
          CupertinoTextField(
            placeholder: '${l10n.checkinsFieldCheckDate} (ISO 8601)',
            controller: _checkDateCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoTextField(
            placeholder: l10n.checkinsFieldTotalTasks,
            controller: _totalTasksCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoTextField(
            placeholder: l10n.checkinsFieldDoneTasks,
            controller: _doneTasksCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(l10n.fieldPerfect),
              CupertinoSwitch(value: _isPerfectVal, onChanged: (v) => setState(() => _isPerfectVal = v)),
            ],
          ),

          CupertinoTextField(
            placeholder: l10n.checkinsFieldPointsEarned,
            controller: _pointsEarnedCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
            ],
          ),
          actions: [
            CupertinoActionSheetAction(
              isDefaultAction: true,
              onPressed: () async {
                final data = <String, dynamic>{};
if (_checkDateCtrl.text.isNotEmpty) data['checkDate'] = _checkDateCtrl.text.trim();
if (_totalTasksCtrl.text.isNotEmpty) data['totalTasks'] = int.tryParse(_totalTasksCtrl.text.trim());
if (_doneTasksCtrl.text.isNotEmpty) data['doneTasks'] = int.tryParse(_doneTasksCtrl.text.trim());
data['isPerfect'] = _isPerfectVal;
if (_pointsEarnedCtrl.text.isNotEmpty) data['pointsEarned'] = int.tryParse(_pointsEarnedCtrl.text.trim());
                // 一个字段都没填就不提交 —— 否则会创建一条空记录。表单不该提交「什么都没说」。
                // Submitting an entirely empty form would create an empty row; don't.
                if (data.isEmpty) return;
                final provider = ctx.read<CheckinsProvider>();
                final ok = await provider.add(data);
                if (!ctx.mounted) return;
                if (!ok) {
                  // 失败时**留着弹层**：用户的输入不作废，只把原因说清。
                  // On failure the sheet stays open — the input is not thrown away, only explained.
                  AppToast.error(ctx, provider.error ?? l10n.unknownError);
                  return;
                }
                Navigator.pop(ctx, true);
              },
              child: Text(l10n.save),
            ),
            CupertinoActionSheetAction(
              onPressed: () => Navigator.pop(ctx),
              child: Text(l10n.cancel),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onDelete(int id) async {
    final l10n = context.l10n;
    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(l10n.checkinsDeleteConfirm),
        actions: [
          CupertinoDialogAction(child: Text(l10n.cancel), onPressed: () => Navigator.pop(ctx, false)),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: Text(l10n.delete),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      final provider = context.read<CheckinsProvider>();
      final ok = await provider.remove(id);
      // 删除失败要说出来：静默什么都不发生，用户只会再点一次。
      // A failed delete has to say so — silently doing nothing invites a second tap.
      if (!ok && mounted) {
        AppToast.error(context, provider.error ?? l10n.unknownError);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final provider = context.watch<CheckinsProvider>();
    final items = provider.items;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.checkinsTitle),
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
      child: provider.loading && items.isEmpty
          ? const Center(child: CupertinoActivityIndicator())
          : items.isEmpty
              ? Center(child: Text(l10n.checkinsEmpty, style: const TextStyle(fontSize: 16)))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => Container(
                    height: 1,
                    margin: const EdgeInsets.only(left: 16),
                    color: CupertinoColors.systemGrey.withAlpha(30),
                  ),
                  itemBuilder: (_, i) {
                    final item = items[i];
                    final title = item.checkDate.toString();
                    return CupertinoListTile(
                      title: Text(title),
                      trailing: CupertinoButton(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(32, 32),
                        onPressed: () => _onDelete(item.id),
                        child: const Icon(
                          CupertinoIcons.trash,
                          size: 18,
                          color: CupertinoColors.destructiveRed,
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
