// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:provider/provider.dart';
import 'package:front_app/core/i18n/app_localizations.dart';
import 'package:front_app/core/widgets/app_shell.dart';
import 'package:front_app/features/auth/presentation/providers/auth_provider.dart';
import '../helpers.dart';

void main() {
  late MockApiClient apiClient;
  late MockAuthRepository authRepository;
  late MockSplashRepository splashRepository;
  late AuthProvider authProvider;
  late GoRouter router;

  setUp(() {
    apiClient = MockApiClient();
    authRepository = MockAuthRepository();
    splashRepository = MockSplashRepository();
    authProvider = AuthProvider(
      authRepository: authRepository,
      splashRepository: splashRepository,
      apiClient: apiClient,
    );
    when(() => authRepository.logout()).thenAnswer((_) async {});
    when(() => apiClient.clearTokens()).thenAnswer((_) async {});
  });

  tearDown(() {
    authProvider.dispose();
  });

  Widget wrap() {
    router = GoRouter(
      initialLocation: '/dashboard',
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) =>
              AppShell(navigationShell: navigationShell),
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/dashboard',
                  builder: (_, _) => const Text('DASH_PAGE'),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/events',
                  builder: (_, _) => const Text('EVENTS_PAGE'),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/explore',
                  builder: (_, _) => const Text('EXPLORE_PAGE'),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/ai',
                  builder: (_, _) => const Text('AI_PAGE'),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/todos',
                  builder: (_, _) => const Text('TODOS_PAGE'),
                ),
              ],
            ),
          ],
        ),
        GoRoute(
          path: '/events/create',
          builder: (_, _) => const Text('CREATE_PAGE'),
        ),
        GoRoute(path: '/profile', builder: (_, _) => const Text('PROFILE_PAGE')),
        GoRoute(
          path: '/profile/edit',
          builder: (_, _) => const Text('EDIT_PROFILE_PAGE'),
        ),
        GoRoute(
          path: '/settings',
          builder: (_, _) => const Text('SETTINGS_PAGE'),
        ),
        GoRoute(path: '/privacy', builder: (_, _) => const Text('PRIVACY_PAGE')),
        GoRoute(path: '/terms', builder: (_, _) => const Text('TERMS_PAGE')),
      ],
    );
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
      ],
      child: CupertinoApp.router(
        routerConfig: router,
        locale: const Locale('zh', 'CN'),
        supportedLocales: const [Locale('en', 'US'), Locale('zh', 'CN')],
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
      ),
    );
  }

  Future<void> pumpShell(WidgetTester tester) async {
    await tester.pumpWidget(wrap());
    await tester.pumpAndSettle();
  }

  testWidgets('渲染 5 个底部 Tab', (tester) async {
    await pumpShell(tester);

    expect(find.text('DASH_PAGE'), findsOneWidget);
    expect(find.text('今日'), findsOneWidget);
    expect(find.text('任务'), findsOneWidget);
    expect(find.text('家庭'), findsOneWidget);
    expect(find.text('奖励'), findsOneWidget);
    expect(find.text('我的'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('点击 Tab 切换分支', (tester) async {
    await pumpShell(tester);

    await tester.tap(find.text('任务'));
    await tester.pumpAndSettle();
    expect(find.text('EVENTS_PAGE'), findsOneWidget);

    await tester.tap(find.text('奖励'));
    await tester.pumpAndSettle();
    expect(find.text('AI_PAGE'), findsOneWidget);

    await tester.tap(find.text('我的'));
    await tester.pumpAndSettle();
    expect(find.text('TODOS_PAGE'), findsOneWidget);
  });

}
