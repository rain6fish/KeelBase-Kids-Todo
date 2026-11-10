// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// 家庭设置：改名、邀请码、审批模式、成员、停用/恢复。
/// 停用只改 status，不删除成员、任务和积分。
class FamilySettingsPage extends StatefulWidget {
  const FamilySettingsPage({super.key});

  @override
  State<FamilySettingsPage> createState() => _FamilySettingsPageState();
}

class _FamilySettingsPageState extends State<FamilySettingsPage> {
  final _nameCtrl = TextEditingController();
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  Map<String, dynamic>? _family;
  List<Map<String, dynamic>> _members = [];
  bool _loading = true;
  bool _saving = false;
  bool _approvalMode = false;
  String _status = 'active';

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    super.dispose();
  }

  Map<String, dynamic> _unwrap(Map<String, dynamic> json) {
    final data = json['data'];
    return data is Map ? Map<String, dynamic>.from(data) : json;
  }

  Future<void> _load() async {
    try {
      final json = await context.read<ApiClient>().get('/auth/family');
      final data = _unwrap(json);
      final family = data['family'];
      final members = data['members'];
      if (!mounted) return;
      setState(() {
        _family = family is Map ? Map<String, dynamic>.from(family) : null;
        _members = members is List
            ? members
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
            : [];
        _nameCtrl.text = (_family?['name'] ?? '').toString();
        _startCtrl.text = (_family?['useTimeStart'] ?? '08:00').toString();
        _endCtrl.text = (_family?['useTimeEnd'] ?? '21:00').toString();
        _approvalMode = _family?['approvalMode'] == true;
        _status = (_family?['status'] ?? 'active').toString();
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        AppToast.error(context, e.toString());
      }
    }
  }

  Future<void> _save() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      await context.read<ApiClient>().patch('/auth/family/settings', data: {
        'name': _nameCtrl.text.trim(),
        'approvalMode': _approvalMode,
        'useTimeStart': _startCtrl.text.trim(),
        'useTimeEnd': _endCtrl.text.trim(),
      });
      if (mounted) {
        AppToast.success(context, '已保存');
        await _load();
      }
    } catch (e) {
      if (mounted) AppToast.error(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggleStatus() async {
    final next = _status == 'active' ? 'inactive' : 'active';
    if (next == 'inactive') {
      final confirmed = await showCupertinoDialog<bool>(
        context: context,
        builder: (ctx) => CupertinoAlertDialog(
          title: const Text('停用家庭？'),
          content: const Text('家庭数据会保留，之后可以随时恢复。'),
          actions: [
            CupertinoDialogAction(
              child: const Text('取消'),
              onPressed: () => Navigator.pop(ctx, false),
            ),
            CupertinoDialogAction(
              isDestructiveAction: true,
              child: const Text('停用'),
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }
    try {
      await context
          .read<ApiClient>()
          .patch('/auth/family/settings', data: {'status': next});
      if (mounted) {
        AppToast.success(context, next == 'active' ? '家庭已恢复' : '家庭已停用');
        await _load();
      }
    } catch (e) {
      if (mounted) AppToast.error(context, e.toString());
    }
  }

  Future<void> _copyInvite() async {
    final code = (_family?['inviteCode'] ?? '').toString();
    if (code.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: code));
    if (mounted) AppToast.success(context, '邀请码已复制');
  }

  Future<void> _addChild() async {
    final l10n = context.l10n;
    final nicknameCtrl = TextEditingController();
    final usernameCtrl = TextEditingController();
    final pinCtrl = TextEditingController();
    var submitting = false;
    String? error;

    final created = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          color: CupertinoColors.systemBackground.resolveFrom(ctx),
          padding: EdgeInsets.fromLTRB(
              16, 12, 16, 16 + MediaQuery.of(ctx).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed:
                        submitting ? null : () => Navigator.pop(ctx, false),
                    child: Text(l10n.cancel),
                  ),
                  Text(l10n.addChild,
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w600)),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: submitting
                        ? null
                        : () async {
                            final nickname = nicknameCtrl.text.trim();
                            final username = usernameCtrl.text.trim();
                            final pin = pinCtrl.text.trim();
                            if (nickname.isEmpty) {
                              setSheetState(
                                  () => error = l10n.childNicknameRequired);
                              return;
                            }
                            if (username.isNotEmpty &&
                                !RegExp(r'^[a-zA-Z0-9_]{3,32}$')
                                    .hasMatch(username)) {
                              setSheetState(
                                  () => error = l10n.childUsernameInvalid);
                              return;
                            }
                            if (!RegExp(r'^\d{4,6}$').hasMatch(pin)) {
                              setSheetState(() => error = l10n.childPinInvalid);
                              return;
                            }
                            setSheetState(() {
                              submitting = true;
                              error = null;
                            });
                            try {
                              await context.read<ApiClient>().post(
                                '/auth/children',
                                data: {
                                  'nickname': nickname,
                                  'pin': pin,
                                  if (username.isNotEmpty) 'username': username,
                                },
                              );
                              if (ctx.mounted) Navigator.pop(ctx, true);
                            } catch (e) {
                              if (ctx.mounted) {
                                setSheetState(() {
                                  submitting = false;
                                  error = e.toString();
                                });
                              }
                            }
                          },
                    child: submitting
                        ? const CupertinoActivityIndicator()
                        : Text(l10n.create),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              CupertinoTextField(
                controller: nicknameCtrl,
                placeholder: l10n.childNickname,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              const SizedBox(height: 10),
              CupertinoTextField(
                controller: usernameCtrl,
                placeholder: l10n.childUsernameHint,
                autocorrect: false,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              const SizedBox(height: 10),
              CupertinoTextField(
                controller: pinCtrl,
                placeholder: l10n.childPin,
                keyboardType: TextInputType.number,
                obscureText: true,
                maxLength: 6,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    error!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 13,
                        color:
                            CupertinoColors.destructiveRed.resolveFrom(ctx)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );

    nicknameCtrl.dispose();
    usernameCtrl.dispose();
    pinCtrl.dispose();
    if (created == true && mounted) {
      AppToast.success(context, l10n.childAdded);
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isParent =
        context.watch<AuthProvider>().user?.familyRole == 'parent';
    final theme = CupertinoTheme.of(context);
    final inviteCode = (_family?['inviteCode'] ?? '').toString();
    final inactive = _status == 'inactive';

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(l10n.familiesTitle),
        trailing: isParent
            ? CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const CupertinoActivityIndicator()
                    : Text(l10n.save),
              )
            : null,
      ),
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator())
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                children: [
                  // 孩子没有可编辑项：家庭名称、邀请码、日常规则都是家长设置。
                  if (isParent) ...[
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: theme.primaryColor.withAlpha(16),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(CupertinoIcons.house_alt,
                                  color: theme.primaryColor, size: 24),
                              const SizedBox(width: 8),
                              Text(
                                inactive ? '家庭已停用' : '我们的家庭',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: inactive
                                      ? CupertinoColors.systemGrey
                                      : theme.primaryColor,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          CupertinoTextField(
                            controller: _nameCtrl,
                            placeholder: '家庭名称',
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                            style: const TextStyle(
                                fontSize: 22, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 14),
                          Text('邀请码',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: CupertinoColors.systemGrey
                                      .resolveFrom(context))),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Text(
                                inviteCode.isEmpty ? '—' : inviteCode,
                                style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 3),
                              ),
                              const SizedBox(width: 12),
                              CupertinoButton(
                                padding: EdgeInsets.zero,
                                minimumSize: const Size(32, 32),
                                onPressed: _copyInvite,
                                child: const Icon(CupertinoIcons.doc_on_doc,
                                    size: 20),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _card(
                      title: '日常规则',
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('孩子创建任务需审批',
                                style: TextStyle(fontSize: 16)),
                            CupertinoSwitch(
                              value: _approvalMode,
                              onChanged: (v) =>
                                  setState(() => _approvalMode = v),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: CupertinoTextField(
                                controller: _startCtrl,
                                placeholder: '可用开始 08:00',
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: CupertinoTextField(
                                controller: _endCtrl,
                                placeholder: '可用结束 21:00',
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  _card(
                    title: '家庭成员',
                    trailing: isParent
                        ? CupertinoButton(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(0, 28),
                            onPressed: _addChild,
                            child: Text(
                              l10n.addChild,
                              style: TextStyle(
                                  fontSize: 14, color: theme.primaryColor),
                            ),
                          )
                        : null,
                    children: [
                      ..._members.map((m) {
                        final isChild = m['familyRole'] == 'child';
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color:
                                      (isChild ? CupertinoColors.systemOrange : theme.primaryColor)
                                          .withAlpha(40),
                                ),
                                child: Center(
                                  child: Text(
                                    (m['nickname'] ?? '?').toString().characters.first,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: isChild
                                          ? CupertinoColors.systemOrange
                                          : theme.primaryColor,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  (m['nickname'] ?? '').toString(),
                                  style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color:
                                      (isChild ? CupertinoColors.systemOrange : theme.primaryColor)
                                          .withAlpha(24),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  isChild ? '孩子' : '家长',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isChild
                                        ? CupertinoColors.systemOrange
                                        : theme.primaryColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                  if (isParent) ...[
                    const SizedBox(height: 24),
                    CupertinoButton(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      color: inactive
                          ? CupertinoColors.activeGreen
                          : CupertinoColors.systemRed.withAlpha(24),
                      borderRadius: BorderRadius.circular(16),
                      onPressed: _toggleStatus,
                      child: Text(
                        inactive ? '恢复家庭' : '停用家庭',
                        style: TextStyle(
                          fontSize: 16,
                          color: inactive
                              ? CupertinoColors.white
                              : CupertinoColors.systemRed,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '停用只改变状态，成员、任务和积分都会保留。',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: CupertinoColors.systemGrey.resolveFrom(context),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _card({
    required String title,
    required List<Widget> children,
    Widget? trailing,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
              ?trailing,
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}
