// SPDX-License-Identifier: Apache-2.0

import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/i18n/app_localizations.dart';
import 'core/router/app_router.dart';
import 'core/services/locale_provider.dart';
import 'core/services/theme_provider.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/onboarding/presentation/providers/onboarding_provider.dart';
import 'core/services/push_token_provider.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  GoRouter? _router;
  AuthProvider? _lastAuth;
  OnboardingProvider? _lastOnboarding;
  AuthProvider? _listenedAuth;
  bool? _lastAuthenticated;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final authProvider = context.read<AuthProvider>();
    if (!identical(authProvider, _listenedAuth)) {
      _listenedAuth?.removeListener(_handleAuthChanged);
      _listenedAuth = authProvider;
      // 初始登录态不算“切换”：冷启动时避免误注销设备 token
      _lastAuthenticated = authProvider.isAuthenticated;
      authProvider.addListener(_handleAuthChanged);
    }
  }

  @override
  void dispose() {
    _listenedAuth?.removeListener(_handleAuthChanged);
    super.dispose();
  }

  // GROWTH-1 推送：登录态变化时注册/注销设备 token（在监听器里处理，
  // 不在 build() 中执行副作用，保证每次登录态切换都被处理）
  void _handleAuthChanged() {
    final authProvider = _listenedAuth;
    if (authProvider == null || !mounted) return;
    final isAuthenticated = authProvider.isAuthenticated;
    if (isAuthenticated == _lastAuthenticated) return;
    _lastAuthenticated = isAuthenticated;
    final pushToken = context.read<PushTokenProvider>();
    unawaited(_syncDeviceToken(pushToken, isAuthenticated));
  }

  Future<void> _syncDeviceToken(PushTokenProvider pushToken, bool register) async {
    try {
      if (register) {
        await pushToken.registerDevice();
      } else {
        await pushToken.unregister();
      }
    } catch (e, st) {
      debugPrint('[Push] device token sync failed: $e\n$st');
    }
  }

  /// 点在任何输入框之外时主动失焦：Flutter Web 在 Android WebView 里若残留一个
  /// 聚焦的输入框，之后每次触摸页面都会把输入法重新拉起。这里按焦点框位置判断，
  /// 点在当前输入框内保持焦点，点其它地方（按钮/空白）先失焦。
  void _dismissKeyboardIfOutsideField(PointerDownEvent event) {
    final focus = FocusManager.instance.primaryFocus;
    if (focus == null || !focus.hasFocus) return;
    final box = focus.context?.findRenderObject();
    if (box is RenderBox && box.hasSize) {
      if ((Offset.zero & box.size).contains(box.globalToLocal(event.position))) {
        return;
      }
    }
    focus.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final authProvider = context.watch<AuthProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final onboardingProvider = context.watch<OnboardingProvider>();

    // Memoize router: only recreate when auth/onboarding provider reference changes,
    // not on every build (which would reset navigation state).
    if (_router == null ||
        authProvider != _lastAuth ||
        onboardingProvider != _lastOnboarding) {
      _router = createRouter(authProvider, onboardingProvider);
      _lastAuth = authProvider;
      _lastOnboarding = onboardingProvider;
    }

    final isDark = themeProvider.themeMode == AppThemeMode.dark ||
        (themeProvider.themeMode == AppThemeMode.system &&
            View.of(context).platformDispatcher.platformBrightness ==
                Brightness.dark);

    return Listener(
      onPointerDown: _dismissKeyboardIfOutsideField,
      child: CupertinoApp.router(
        title: 'KeelBase',
        debugShowCheckedModeBanner: false,
        theme: isDark ? AppTheme.darkTheme : AppTheme.lightTheme,
        routerConfig: _router!,
        locale: localeProvider.locale,
        supportedLocales: const [
          Locale('en', 'US'),
          Locale('zh', 'CN'),
        ],
        localizationsDelegates: [
          AppLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
      ),
    );
  }
}
