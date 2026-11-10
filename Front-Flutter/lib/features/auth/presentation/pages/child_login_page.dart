// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_primary_button.dart';
import '../../../../core/widgets/app_toast.dart';
import '../providers/auth_provider.dart';

/// 孩子登录：家庭邀请码 + 登录账号 + PIN。
///
/// 独立页面而非塞进家长登录页：两种登录的凭据完全不同，混在一个表单里
/// 既难校验也容易让家长误填。
class ChildLoginPage extends StatefulWidget {
  const ChildLoginPage({super.key});

  @override
  State<ChildLoginPage> createState() => _ChildLoginPageState();
}

class _ChildLoginPageState extends State<ChildLoginPage> {
  final _inviteCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();

  @override
  void dispose() {
    _inviteCtrl.dispose();
    _usernameCtrl.dispose();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    final l10n = context.l10n;
    final inviteCode = _inviteCtrl.text.trim().toUpperCase();
    final username = _usernameCtrl.text.trim();
    final pin = _pinCtrl.text.trim();
    if (username.isEmpty || pin.isEmpty) {
      AppToast.error(context, l10n.unknownError);
      return;
    }

    final auth = context.read<AuthProvider>();
    auth.clearError();
    final ok = await auth.childLogin(
      username: username,
      pin: pin,
      inviteCode: inviteCode.isEmpty ? null : inviteCode,
    );
    if (!mounted) return;
    if (ok) {
      AppToast.success(context, l10n.loginSuccess);
    } else {
      AppToast.error(context, auth.error ?? l10n.unknownError);
    }
  }

  Widget _field({
    required TextEditingController controller,
    required String placeholder,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscure = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CupertinoColors.systemGrey.withAlpha(50)),
      ),
      child: CupertinoTextField(
        controller: controller,
        placeholder: placeholder,
        obscureText: obscure,
        keyboardType: keyboardType,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        prefix: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Icon(icon, size: 22, color: CupertinoColors.systemGrey),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final auth = context.watch<AuthProvider>();
    final isLoading = auth.status == AuthStatus.loading;

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        leading: CupertinoNavigationBarBackButton(
          previousPageTitle: l10n.backToParentLogin,
          onPressed: () => context.canPop() ? context.pop() : context.go('/login'),
        ),
        middle: Text(l10n.childLoginTitle),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: CupertinoTheme.of(context).primaryColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(CupertinoIcons.person_fill, size: 36),
              ),
              const SizedBox(height: 20),
              Text(
                l10n.childLoginHint,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: CupertinoColors.systemGrey),
              ),
              const SizedBox(height: 28),
              _field(
                controller: _inviteCtrl,
                placeholder: l10n.inviteCodeOptional,
                icon: CupertinoIcons.ticket,
              ),
              const SizedBox(height: 14),
              _field(
                controller: _usernameCtrl,
                placeholder: l10n.childLoginUsername,
                icon: CupertinoIcons.person,
              ),
              const SizedBox(height: 14),
              _field(
                controller: _pinCtrl,
                placeholder: l10n.childPin,
                icon: CupertinoIcons.lock,
                keyboardType: TextInputType.number,
                obscure: true,
              ),
              const SizedBox(height: 28),
              AppPrimaryButton(
                label: l10n.login,
                isLoading: isLoading,
                onPressed: _onSubmit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
