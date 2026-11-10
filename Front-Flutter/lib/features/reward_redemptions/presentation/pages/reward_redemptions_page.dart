// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import '../../../../core/api/api_client.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../data/models/reward_redemption_model.dart';
import '../providers/reward_redemptions_provider.dart';

/// 兑换记录页
class RewardRedemptionsPage extends StatefulWidget {
  const RewardRedemptionsPage({super.key});

  @override
  State<RewardRedemptionsPage> createState() => _RewardRedemptionsPageState();
}

class _RewardRedemptionsPageState extends State<RewardRedemptionsPage> {
  final _rewardIdIdCtrl = TextEditingController();
  final _pointsSpentCtrl = TextEditingController();
  bool _isCancelledVal = false;
  final _noteCtrl = TextEditingController();
  int? _rewardIdIdVal;
  List<Map<String, dynamic>> _rewardIdOptions = const [];

  ///
  /// Relations and attachments, shown instead of their raw ids. Parts with no value
  /// are dropped so an empty row does not render a stray separator.
  ///
  /// 关联与附件的回显（显示名字而非裸 id）；无值的部分略去，
  /// 免得空行渲染出多余的分隔符。
  ///
  String _echo(RewardRedemptionModel item) {
    final parts = <String>[
      if (item.rewardIdName != null && item.rewardIdName!.isNotEmpty) item.rewardIdName!,
    ];
    return parts.where((p) => p.isNotEmpty).join(' · ');
  }


  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) context.read<RewardRedemptionsProvider>().load();
    });
    // 关联选项：只取**调用者自己看得见**的记录（用户端列表自带范围过滤），
    // 取不到就不阻塞表单 —— 下拉留空并回落到手工输入 id。
    Future.microtask(() async {
      if (!mounted) return;
      final client = context.read<ApiClient>();
      try {
        final json = await client.get('/rewards');
        final list = (json['data'] as List?) ?? const [];
        if (mounted) {
          setState(() {
            _rewardIdOptions = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          });
        }
      } catch (_) {
        // 选项不可得不影响创建：仍可用 id 手工关联。
      }
    });
  }

  @override
  void dispose() {
    _rewardIdIdCtrl.dispose();
    _pointsSpentCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _onAdd() async {
    final l10n = context.l10n;
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: CupertinoActionSheet(
          title: Text(l10n.reward_redemptionsAddTitle),
          message: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
          if (_rewardIdOptions.isEmpty)
            CupertinoTextField(
              placeholder: '${l10n.reward_redemptionsFieldRewardId} ID（rewards）',
              controller: _rewardIdIdCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: false),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            )
          else
            CupertinoSlidingSegmentedControl<int>(
              groupValue: _rewardIdIdVal,
              onValueChanged: (v) => setState(() => _rewardIdIdVal = v),
              children: {
                for (final o in _rewardIdOptions)
                  (o['id'] as int): Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    child: Text('${o['title'] ?? o['id']}'),
                  ),
              },
            ),

          CupertinoTextField(
            placeholder: l10n.reward_redemptionsFieldPointsSpent,
            controller: _pointsSpentCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(l10n.fieldCancelled),
              CupertinoSwitch(value: _isCancelledVal, onChanged: (v) => setState(() => _isCancelledVal = v)),
            ],
          ),

          CupertinoTextField(
            placeholder: l10n.reward_redemptionsFieldNote,
            controller: _noteCtrl,
            maxLines: 3,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
            ],
          ),
          actions: [
            CupertinoActionSheetAction(
              isDefaultAction: true,
              onPressed: () async {
                final data = <String, dynamic>{};
if (_rewardIdIdVal != null) {
        data['rewardIdId'] = _rewardIdIdVal;
      } else if (_rewardIdIdCtrl.text.isNotEmpty) {
        data['rewardIdId'] = int.tryParse(_rewardIdIdCtrl.text.trim());
      }
if (_pointsSpentCtrl.text.isNotEmpty) data['pointsSpent'] = int.tryParse(_pointsSpentCtrl.text.trim());
data['isCancelled'] = _isCancelledVal;
if (_noteCtrl.text.isNotEmpty) data['note'] = _noteCtrl.text.trim();
                // 一个字段都没填就不提交 —— 否则会创建一条空记录。表单不该提交「什么都没说」。
                // Submitting an entirely empty form would create an empty row; don't.
                if (data.isEmpty) return;
                final provider = ctx.read<RewardRedemptionsProvider>();
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
        title: Text(l10n.reward_redemptionsDeleteConfirm),
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
      final provider = context.read<RewardRedemptionsProvider>();
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
    final provider = context.watch<RewardRedemptionsProvider>();
    final items = provider.items;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.reward_redemptionsTitle),
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
              ? Center(child: Text(l10n.reward_redemptionsEmpty, style: const TextStyle(fontSize: 16)))
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => Container(
                    height: 1,
                    margin: const EdgeInsets.only(left: 16),
                    color: CupertinoColors.systemGrey.withAlpha(30),
                  ),
                  itemBuilder: (_, i) {
                    final item = items[i];
                    final title = (item.rewardIdName ?? item.rewardIdId?.toString()) ?? '-';
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
