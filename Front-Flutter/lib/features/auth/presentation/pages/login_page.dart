// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_primary_button.dart';
import '../../../../core/widgets/app_toast.dart';
import '../providers/auth_provider.dart';
import '../utils/oauth_error_text.dart';
import '../../data/services/oauth_providers.dart';
import '../../data/services/oauth_service.dart';

/// 登录失败该给用户看的那一句，没有失败就返回 null。
///
/// 两类失败合在这里裁决，别处不再各自拼：① 登录方式自身的失败 —— provider 存的是**key**，
/// 句子在这里译；② 其余（服务端/技术文本）—— 原样用，但**用户主动取消不算失败**：
/// 平台渠道取消时抛的原生异常文本带 "cancel"，此前正是靠 `contains('cancel')` 把它滤掉，
/// 那个判断现在收在这里一处。
///
/// One place decides what a failed sign-in shows. Provider-side failures arrive as a key and are
/// worded here; anything else is technical text and passes through, except that a user cancelling is
/// not a failure — the platform channel reports it as an exception whose text says "cancel".
String? loginErrorText(AuthProvider auth, AppLocalizations l10n) {
  final oauth = auth.oauthError;
  if (oauth != null) {
    return oauth.key == OAuthErrorKey.cancelled ? null : oauthErrorText(l10n, oauth);
  }
  final raw = auth.error;
  if (raw == null) return null;
  return raw.toLowerCase().contains('cancel') ? null : raw;
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _usernameFocus = FocusNode();
  final _passwordFocus = FocusNode();
  bool _obscurePassword = true;
  bool _agree = false;
  bool _appleAvailable = true;
  bool _weChatAvailable = false;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    final auth = context.read<AuthProvider>();
    await auth.fetchProviderConfig();
    final svc = auth.oauthService;
    if (mounted) {
      setState(() {
        _appleAvailable = true;
      });
    }
    // Non-blocking checks for native SDK availability
    auth.oauthService.isAppleSignInAvailable().then((v) {
      if (mounted) setState(() => _appleAvailable = v);
    }).catchError((_) {
      // 探测失败视为不可用，避免显示必失败的入口
      if (mounted) setState(() => _appleAvailable = false);
    });
    if (!kIsWeb) {
      svc.isWeChatInstalled().then((v) {
        if (mounted) setState(() => _weChatAvailable = v);
      }).catchError((_) {
        if (mounted) setState(() => _weChatAvailable = false);
      });
    }
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    _usernameFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  /// Check agreement before any login action.
  bool _checkAgree() {
    if (!_agree) {
      AppToast.error(context, context.l10n.agreementRequired);
      return false;
    }
    return true;
  }

  Future<void> _onLogin() async {
    if (!_checkAgree()) return;
    final username = _usernameCtrl.text.trim();
    final password = _passwordCtrl.text;
    if (username.isEmpty || password.isEmpty) return;

    final auth = context.read<AuthProvider>();
    auth.clearError();
    final l10n = context.l10n;
    final ok = await auth.login(username, password);

    if (!mounted) return;
    if (ok) {
      FocusManager.instance.primaryFocus?.unfocus();
      AppToast.success(context, l10n.loginSuccess);
    } else {
      if (auth.cooldownRemaining == 0) {
        AppToast.error(context, loginErrorText(auth, l10n) ?? l10n.unknownError);
      }
    }
  }

  Future<void> _onOAuthLogin(String provider) async {
    if (!_checkAgree()) return;
    final auth = context.read<AuthProvider>();
    auth.clearError();
    final l10n = context.l10n;
    final ok = await auth.oauthLogin(provider);

    if (!mounted) return;
    if (ok) {
      AppToast.success(context, l10n.loginSuccess);
    } else {
      final msg = loginErrorText(auth, l10n);
      if (msg != null) AppToast.error(context, msg);
    }
  }

  // ─── Widget builders ──────────────────────────────────────────────────

  Widget _buildSocialButton({
    required OAuthProviderMeta provider,
    required bool isLoading,
    bool? enabled,
  }) {
    final isEnabled = enabled ?? true;
    return SizedBox(
      width: 60,
      child: CupertinoButton(
        padding: EdgeInsets.zero,
        borderRadius: const BorderRadius.all(Radius.circular(30)),
        onPressed: (isLoading || !isEnabled) ? null : () => _onOAuthLogin(provider.id), minimumSize: Size(0, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: isEnabled
                    ? CupertinoColors.tertiarySystemBackground.resolveFrom(context)
                    : CupertinoColors.tertiarySystemBackground.resolveFrom(context).withAlpha(80),
                borderRadius: BorderRadius.circular(26),
                border: Border.all(
                  color: CupertinoColors.systemGrey.withAlpha(40),
                ),
              ),
              child: Center(
                child: Icon(
                  OAuthProviders.iconFor(provider.id),
                  size: 24,
                  color: isEnabled ? CupertinoColors.label : CupertinoColors.systemGrey,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              provider.name,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isEnabled
                    ? CupertinoColors.systemGrey.resolveFrom(context)
                    : CupertinoColors.systemGrey.withAlpha(80),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController ctrl,
    required FocusNode focusNode,
    required String placeholder,
    required IconData icon,
    required TextInputAction action,
    bool obscure = false,
    bool showToggle = false,
    VoidCallback? onToggle,
    VoidCallback? onSubmitted,
    TextInputType? keyboardType,
  }) {
    final t = CupertinoTheme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CupertinoColors.systemGrey.withAlpha(50)),
      ),
      child: CupertinoTextField(
        controller: ctrl,
        focusNode: focusNode,
        onTapOutside: (_) => focusNode.unfocus(),
        placeholder: placeholder,
        placeholderStyle: TextStyle(fontSize: 16, color: CupertinoColors.systemGrey.resolveFrom(context)),
        style: TextStyle(fontSize: 16, color: t.textTheme.textStyle.color),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        obscureText: obscure,
        clearButtonMode: OverlayVisibilityMode.editing,
        prefix: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Icon(icon, size: 22, color: CupertinoColors.systemGrey.resolveFrom(context)),
        ),
        suffix: showToggle
            ? CupertinoButton(
                padding: const EdgeInsets.only(right: 6),
                onPressed: onToggle, minimumSize: Size(32, 32),
                child: Icon(
                  obscure ? CupertinoIcons.eye : CupertinoIcons.eye_slash,
                  size: 20, color: CupertinoColors.systemGrey,
                ),
              )
            : null,
        textInputAction: action,
        keyboardType: keyboardType,
        onSubmitted: (_) => onSubmitted ?? (action == TextInputAction.next
            ? _passwordFocus.requestFocus()
            : _onLogin()),
      ),
    );
  }

  Widget _buildTab({
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    final t = CupertinoTheme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Text(
        label,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: active ? t.primaryColor : CupertinoColors.systemGrey.resolveFrom(context),
        ),
      ),
    );
  }

  Widget _buildOrDivider() {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Expanded(child: Container(height: 0.5,
              color: CupertinoColors.separator.resolveFrom(context).withAlpha(60))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(l10n.or, style: TextStyle(
                fontSize: 13, color: CupertinoColors.systemGrey.resolveFrom(context))),
          ),
          Expanded(child: Container(height: 0.5,
              color: CupertinoColors.separator.resolveFrom(context).withAlpha(60))),
        ],
      ),
    );
  }

  Widget _buildProviderSection({
    required String title,
    required List<OAuthProviderMeta> providers,
    required bool isLoading,
  }) {
    if (providers.isEmpty) return const SizedBox.shrink();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: providers.map((p) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: _buildSocialButton(provider: p, isLoading: isLoading),
            );
          }).toList(),
        ),
      ],
    );
  }

  /// Agreement checkbox with tappable links to legal pages.
  Widget _buildAgreement() {
    final l10n = context.l10n;
    final t = CupertinoTheme.of(context);
    final grey = CupertinoColors.systemGrey.resolveFrom(context);

    TextStyle bodyStyle = TextStyle(fontSize: 13, color: grey);
    TextStyle linkStyle = TextStyle(fontSize: 13, color: t.primaryColor, fontWeight: FontWeight.w600);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 4,
        runSpacing: 4,
        children: [
          // Checkbox
          GestureDetector(
            onTap: () => setState(() => _agree = !_agree),
            child: Container(
              width: 22,
              height: 22,
              margin: const EdgeInsets.only(right: 10),
              decoration: BoxDecoration(
                color: _agree
                    ? t.primaryColor
                    : CupertinoColors.tertiarySystemBackground.resolveFrom(context),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: _agree
                      ? t.primaryColor
                      : grey.withAlpha(120),
                  width: _agree ? 0 : 1.5,
                ),
              ),
              child: _agree
                  ? const Icon(CupertinoIcons.check_mark, size: 16, color: CupertinoColors.white)
                  : null,
            ),
          ),
          // Text
          Text.rich(
            TextSpan(
              style: bodyStyle,
              children: [
                TextSpan(text: l10n.agreeLabel),
                const TextSpan(text: ' '),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => context.push('/privacy'),
            child: Text(l10n.privacyPolicyLink, style: linkStyle),
          ),
          Text(' ${l10n.and} ', style: bodyStyle),
          GestureDetector(
            onTap: () => context.push('/terms'),
            child: Text(l10n.termsOfServiceLink, style: linkStyle),
          ),
        ],
      ),
    );
  }

  // ─── Build ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final t = CupertinoTheme.of(context);
    final auth = context.watch<AuthProvider>();
    final isLoading = auth.status == AuthStatus.loading;
    final authError = auth.status == AuthStatus.error ? loginErrorText(auth, l10n) : null;
    final cooldown = auth.cooldownRemaining;
    final isCooldown = cooldown > 0;
    final cfg = auth.providerConfig;

    // Filter providers by platform availability
    List<OAuthProviderMeta> available(List<OAuthProviderMeta> list) {
      return list.where((p) {
        if (p.id == 'apple' && !_appleAvailable) return false;
        if (p.id == 'wechat' && !_weChatAvailable) return false;
        // nativeOnly（微信/支付宝）仅在原生移动端展示，Web/桌面一律过滤
        if (p.nativeOnly && !OAuthProviders.isMobilePlatform) return false;
        return true;
      }).toList();
    }

    final international = available(cfg.international);
    final china = available(cfg.china);
    final showInternational = international.isNotEmpty;
    final showChina = china.isNotEmpty;
    final showOAuth = showInternational || showChina;

    return CupertinoPageScaffold(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            // Logo
            Container(
              width: 88, height: 88,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [t.primaryColor, t.primaryColor.withAlpha(180)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
              ),
              child: const Icon(CupertinoIcons.sparkles, size: 44, color: CupertinoColors.white),
            ),
            const SizedBox(height: 20),
            Text(AppConstants.appName, style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w700, color: CupertinoColors.label)),
            const SizedBox(height: 8),
            Text(
              l10n.loginSlogan,
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: t.primaryColor),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              l10n.loginSloganSub,
              style: TextStyle(fontSize: 12, color: CupertinoColors.systemGrey.resolveFrom(context)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // Error
            if (authError != null && !isCooldown)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: CupertinoColors.destructiveRed.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: CupertinoColors.destructiveRed.withAlpha(40)),
                ),
                child: Row(children: [
                  const Icon(CupertinoIcons.exclamationmark_circle, size: 18, color: CupertinoColors.destructiveRed),
                  const SizedBox(width: 10),
                  Expanded(child: Text(authError, style: const TextStyle(fontSize: 14, color: CupertinoColors.destructiveRed))),
                ]),
              ),

            // 登录方式切换（账号密码 / 孩子登录）
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              _buildTab(label: l10n.passwordLogin, active: true, onTap: () {}),
              const SizedBox(width: 24),
              _buildTab(
                label: l10n.childLoginTitle,
                active: false,
                onTap: () => context.push('/child-login'),
              ),
            ]),
            const SizedBox(height: 24),

            // Username (Enter → focus password)
            _buildField(
              ctrl: _usernameCtrl, focusNode: _usernameFocus,
              placeholder: l10n.username, icon: CupertinoIcons.person_fill,
              action: TextInputAction.next,
              onSubmitted: () => _passwordFocus.requestFocus(),
            ),
            const SizedBox(height: 14),

            // Password (Enter → login)
            _buildField(
              ctrl: _passwordCtrl, focusNode: _passwordFocus,
              placeholder: l10n.password, icon: CupertinoIcons.lock_fill,
              action: TextInputAction.done, obscure: _obscurePassword,
              showToggle: true, onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            const SizedBox(height: 32),

            // Login button
            if (isCooldown)
              SizedBox(
                width: double.infinity, height: 54,
                child: CupertinoButton(
                  onPressed: null,
                  disabledColor: CupertinoColors.systemGrey5.withAlpha(60),
                  borderRadius: const BorderRadius.all(Radius.circular(27)),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(CupertinoIcons.timer, size: 18, color: CupertinoColors.systemGrey),
                    const SizedBox(width: 8),
                    Text(l10n.retryIn(cooldown), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: CupertinoColors.systemGrey, height: 1.2)),
                  ]),
                ),
              )
            else
              AppPrimaryButton(label: l10n.login, isLoading: isLoading, onPressed: _onLogin),

            // ── Agreement checkbox ──
            _buildAgreement(),

            const SizedBox(height: 8),

            // Register + forgot password links
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => context.push('/forgot-password'),
                child: Text(
                  l10n.forgotPassword,
                  style: TextStyle(
                    color: CupertinoColors.systemGrey.resolveFrom(context),
                    fontSize: 14,
                  ),
                ),
              ),
              Text(' · ', style: TextStyle(color: CupertinoColors.systemGrey.resolveFrom(context), fontSize: 14)),
              CupertinoButton(
                padding: EdgeInsets.zero,
                onPressed: () => context.push('/register'),
                child: Text(
                  l10n.register,
                  style: TextStyle(
                    color: t.primaryColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 16),
          ]),
        ),
      ),
    );
  }
}
