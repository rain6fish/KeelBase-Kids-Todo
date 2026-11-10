// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import '../../../../core/api/api_client.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../data/models/badge_award_model.dart';
import '../providers/badge_awards_provider.dart';

/// 徽章授予页
class BadgeAwardsPage extends StatefulWidget {
  const BadgeAwardsPage({super.key});

  @override
  State<BadgeAwardsPage> createState() => _BadgeAwardsPageState();
}

class _BadgeAwardsPageState extends State<BadgeAwardsPage> {
  final _badgeIdIdCtrl = TextEditingController();
  final _earnedOnCtrl = TextEditingController();
  int? _badgeIdIdVal;
  List<Map<String, dynamic>> _badgeIdOptions = const [];

  ///
  /// Relations and attachments, shown instead of their raw ids. Parts with no value
  /// are dropped so an empty row does not render a stray separator.
  ///
  /// 关联与附件的回显（显示名字而非裸 id）；无值的部分略去，
  /// 免得空行渲染出多余的分隔符。
  ///
  String _echo(BadgeAwardModel item) {
    final parts = <String>[
      if (item.badgeIdName != null && item.badgeIdName!.isNotEmpty) item.badgeIdName!,
    ];
    return parts.where((p) => p.isNotEmpty).join(' · ');
  }


  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) context.read<BadgeAwardsProvider>().load();
    });
    // 关联选项：只取**调用者自己看得见**的记录（用户端列表自带范围过滤），
    // 取不到就不阻塞表单 —— 下拉留空并回落到手工输入 id。
    Future.microtask(() async {
      if (!mounted) return;
      final client = context.read<ApiClient>();
      try {
        final json = await client.get('/badges');
        final list = (json['data'] as List?) ?? const [];
        if (mounted) {
          setState(() {
            _badgeIdOptions = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          });
        }
      } catch (_) {
        // 选项不可得不影响创建：仍可用 id 手工关联。
      }
    });
  }

  @override
  void dispose() {
    _badgeIdIdCtrl.dispose();
    _earnedOnCtrl.dispose();
    super.dispose();
  }

  Future<void> _onAdd() async {
    final l10n = context.l10n;
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: CupertinoActionSheet(
          title: Text(l10n.badge_awardsAddTitle),
          message: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
          if (_badgeIdOptions.isEmpty)
            CupertinoTextField(
              placeholder: '${l10n.badge_awardsFieldBadgeId} ID（badges）',
              controller: _badgeIdIdCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: false),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            )
          else
            CupertinoSlidingSegmentedControl<int>(
              groupValue: _badgeIdIdVal,
              onValueChanged: (v) => setState(() => _badgeIdIdVal = v),
              children: {
                for (final o in _badgeIdOptions)
                  (o['id'] as int): Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    child: Text('${o['name'] ?? o['id']}'),
                  ),
              },
            ),

          CupertinoTextField(
            placeholder: '${l10n.badge_awardsFieldEarnedOn} (ISO 8601)',
            controller: _earnedOnCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
            ],
          ),
          actions: [
            CupertinoActionSheetAction(
              isDefaultAction: true,
              onPressed: () async {
                final data = <String, dynamic>{};
if (_badgeIdIdVal != null) {
        data['badgeIdId'] = _badgeIdIdVal;
      } else if (_badgeIdIdCtrl.text.isNotEmpty) {
        data['badgeIdId'] = int.tryParse(_badgeIdIdCtrl.text.trim());
      }
if (_earnedOnCtrl.text.isNotEmpty) data['earnedOn'] = _earnedOnCtrl.text.trim();
                // 一个字段都没填就不提交 —— 否则会创建一条空记录。表单不该提交「什么都没说」。
                // Submitting an entirely empty form would create an empty row; don't.
                if (data.isEmpty) return;
                final provider = ctx.read<BadgeAwardsProvider>();
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
        title: Text(l10n.badge_awardsDeleteConfirm),
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
      final provider = context.read<BadgeAwardsProvider>();
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
    final provider = context.watch<BadgeAwardsProvider>();
    final items = provider.items;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.badge_awardsTitle),
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
              ? Center(child: Text(l10n.badge_awardsEmpty, style: const TextStyle(fontSize: 16)))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => Container(
                    height: 1,
                    margin: const EdgeInsets.only(left: 16),
                    color: CupertinoColors.systemGrey.withAlpha(30),
                  ),
                  itemBuilder: (_, i) {
                    final item = items[i];
                    final title = (item.badgeIdName ?? item.badgeIdId?.toString()) ?? '-';
                    return CupertinoListTile(
                      title: Text(title),
                      subtitle: Text(_echo(item)),
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
