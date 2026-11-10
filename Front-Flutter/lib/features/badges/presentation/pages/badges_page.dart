// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../providers/badges_provider.dart';

/// 徽章页
class BadgesPage extends StatefulWidget {
  const BadgesPage({super.key});

  @override
  State<BadgesPage> createState() => _BadgesPageState();
}

class _BadgesPageState extends State<BadgesPage> {
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  String _badgeTypeVal = 'streak_3';
  final _thresholdCtrl = TextEditingController();
  final _iconUrlCtrl = TextEditingController();



  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) context.read<BadgesProvider>().load();
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _thresholdCtrl.dispose();
    _iconUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _onAdd() async {
    final l10n = context.l10n;
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: CupertinoActionSheet(
          title: Text(l10n.badgesAddTitle),
          message: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
          CupertinoTextField(
            placeholder: l10n.badgesFieldName,
            controller: _nameCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoTextField(
            placeholder: l10n.badgesFieldDescription,
            controller: _descriptionCtrl,
            maxLines: 3,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoSegmentedControl<String>(
            groupValue: _badgeTypeVal,
            onValueChanged: (v) => setState(() => _badgeTypeVal = v),
            children: {
              for (final o in ["streak_3","streak_7","streak_30","streak_100","points_50","points_200","points_500","perfect_day","perfect_week"]) o: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: Text(l10n.enumLabel(o)),
              ),
            },
          ),

          CupertinoTextField(
            placeholder: l10n.badgesFieldThreshold,
            controller: _thresholdCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          CupertinoTextField(
            placeholder: l10n.badgesFieldIconUrl,
            controller: _iconUrlCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
            ],
          ),
          actions: [
            CupertinoActionSheetAction(
              isDefaultAction: true,
              onPressed: () async {
                final data = <String, dynamic>{};
if (_nameCtrl.text.isNotEmpty) data['name'] = _nameCtrl.text.trim();
if (_descriptionCtrl.text.isNotEmpty) data['description'] = _descriptionCtrl.text.trim();
data['badgeType'] = _badgeTypeVal;
if (_thresholdCtrl.text.isNotEmpty) data['threshold'] = int.tryParse(_thresholdCtrl.text.trim());
if (_iconUrlCtrl.text.isNotEmpty) data['iconUrl'] = _iconUrlCtrl.text.trim();
                // 一个字段都没填就不提交 —— 否则会创建一条空记录。表单不该提交「什么都没说」。
                // Submitting an entirely empty form would create an empty row; don't.
                if (data.isEmpty) return;
                final provider = ctx.read<BadgesProvider>();
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
        title: Text(l10n.badgesDeleteConfirm),
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
      final provider = context.read<BadgesProvider>();
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
    final provider = context.watch<BadgesProvider>();
    final items = provider.items;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.badgesTitle),
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
              ? Center(child: Text(l10n.badgesEmpty, style: const TextStyle(fontSize: 16)))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => Container(
                    height: 1,
                    margin: const EdgeInsets.only(left: 16),
                    color: CupertinoColors.systemGrey.withAlpha(30),
                  ),
                  itemBuilder: (_, i) {
                    final item = items[i];
                    final title = item.name.toString();
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
