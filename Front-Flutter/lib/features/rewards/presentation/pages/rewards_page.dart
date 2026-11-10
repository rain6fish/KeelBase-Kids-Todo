// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/rewards_provider.dart';

/// 奖励页
class RewardsPage extends StatefulWidget {
  const RewardsPage({super.key});

  @override
  State<RewardsPage> createState() => _RewardsPageState();
}

class _RewardsPageState extends State<RewardsPage> {
  final _titleCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _pointsCostCtrl = TextEditingController();
  bool _isActiveVal = false;



  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) context.read<RewardsProvider>().load();
    });
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    _pointsCostCtrl.dispose();
    super.dispose();
  }

  Future<void> _onAdd() async {
    final l10n = context.l10n;
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: CupertinoActionSheet(
          title: Text(l10n.rewardsAddTitle),
          message: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
          CupertinoTextField(
            placeholder: l10n.rewardsFieldTitle,
            controller: _titleCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoTextField(
            placeholder: l10n.rewardsFieldDescription,
            controller: _descriptionCtrl,
            maxLines: 3,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoTextField(
            placeholder: l10n.rewardsFieldPointsCost,
            controller: _pointsCostCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(l10n.fieldEnabled),
              CupertinoSwitch(value: _isActiveVal, onChanged: (v) => setState(() => _isActiveVal = v)),
            ],
          ),
            ],
          ),
          actions: [
            CupertinoActionSheetAction(
              isDefaultAction: true,
              onPressed: () async {
                final data = <String, dynamic>{};
if (_titleCtrl.text.isNotEmpty) data['title'] = _titleCtrl.text.trim();
if (_descriptionCtrl.text.isNotEmpty) data['description'] = _descriptionCtrl.text.trim();
if (_pointsCostCtrl.text.isNotEmpty) data['pointsCost'] = int.tryParse(_pointsCostCtrl.text.trim());
data['isActive'] = _isActiveVal;
                // 一个字段都没填就不提交 —— 否则会创建一条空记录。表单不该提交「什么都没说」。
                // Submitting an entirely empty form would create an empty row; don't.
                if (data.isEmpty) return;
                final provider = ctx.read<RewardsProvider>();
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
        title: Text(l10n.rewardsDeleteConfirm),
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
      final provider = context.read<RewardsProvider>();
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
    final provider = context.watch<RewardsProvider>();
    final items = provider.items;
    // 孩子只能看和兑换：新增、删除是家长的操作。
    final isParent = context.watch<AuthProvider>().user?.familyRole == 'parent';

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.rewardsTitle),
        trailing: isParent
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                minimumSize: const Size(36, 36),
                onPressed: _onAdd,
                child: Icon(
                  CupertinoIcons.add,
                  size: 24,
                  color: CupertinoTheme.of(context).primaryColor,
                ),
              )
            : null,
      ),
      child: provider.loading && items.isEmpty
          ? const Center(child: CupertinoActivityIndicator())
          : items.isEmpty
              ? Center(child: Text(l10n.rewardsEmpty, style: const TextStyle(fontSize: 16)))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => Container(
                    height: 1,
                    margin: const EdgeInsets.only(left: 16),
                    color: CupertinoColors.systemGrey.withAlpha(30),
                  ),
                  itemBuilder: (_, i) {
                    final item = items[i];
                    final title = item.title.toString();
                    return CupertinoListTile(
                      title: Text(title),
                      trailing: isParent
                          ? CupertinoButton(
                              padding: EdgeInsets.zero,
                              minimumSize: const Size(32, 32),
                              onPressed: () => _onDelete(item.id),
                              child: const Icon(
                                CupertinoIcons.trash,
                                size: 18,
                                color: CupertinoColors.destructiveRed,
                              ),
                            )
                          : null,
                    );
                  },
                ),
    );
  }
}
