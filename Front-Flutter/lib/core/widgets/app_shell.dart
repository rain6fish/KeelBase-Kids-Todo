// SPDX-License-Identifier: Apache-2.0

import 'dart:ui' show ImageFilter;

import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import '../i18n/app_localizations.dart';

/// iOS-style bottom tab bar with blurred background.
class AppShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({super.key, required this.navigationShell});

  static const _tabs = <_TabItem>[
    _TabItem(icon: CupertinoIcons.house_fill, labelKey: 'tabHome'),
    _TabItem(icon: CupertinoIcons.checkmark_circle, labelKey: 'tabEvents'),
    _TabItem(icon: CupertinoIcons.person_2, labelKey: 'tabExplore'),
    _TabItem(icon: CupertinoIcons.gift, labelKey: 'tabAi'),
    _TabItem(icon: CupertinoIcons.person, labelKey: 'tabTodos'),
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = CupertinoTheme.of(context);
    final selectedIndex = navigationShell.currentIndex;
    final isDark = CupertinoTheme.brightnessOf(context) == Brightness.dark;
    // 5 个 Tab 与 router 的 5 个 StatefulShellBranch 一一对应
    assert(_tabs.length == 5, 'AppShell expects 5 tabs');

    // Use a plain ColoredBox instead of nested CupertinoPageScaffold
    // to avoid double safe-area + gray gap issues.
    return ColoredBox(
      color: theme.scaffoldBackgroundColor,
      child: Column(
        children: [
          // Main content — fills all remaining space above the tab bar
          Expanded(child: navigationShell),

          // Tab bar
          _buildTabBar(context, l10n, theme, selectedIndex, isDark),
        ],
      ),
    );
  }

  Widget _buildTabBar(
    BuildContext context,
    AppLocalizations l10n,
    CupertinoThemeData theme,
    int selectedIndex,
    bool isDark,
  ) {
    return Container(
      height: 48 + MediaQuery.of(context).padding.bottom,
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: isDark
                ? CupertinoColors.separator
                    .resolveFrom(context)
                    .withValues(alpha: 40 / 255)
                : CupertinoColors.opaqueSeparator.resolveFrom(context),
            width: 0.5,
          ),
        ),
      ),
      child: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            color: isDark
                ? const Color(0xCC000000)
                : CupertinoColors.systemBackground
                    .resolveFrom(context)
                    .withValues(alpha: 240 / 255),
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final isSelected = i == selectedIndex;

                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => navigationShell.goBranch(i),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          tab.icon,
                          size: 24,
                          color: isSelected
                              ? theme.primaryColor
                              : CupertinoColors.systemGrey.resolveFrom(context),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _label(l10n, tab.labelKey),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected
                                ? theme.primaryColor
                                : CupertinoColors.systemGrey.resolveFrom(context),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  String _label(AppLocalizations l10n, String key) {
    switch (key) {
      case 'tabHome':
        return l10n.tabToday;
      case 'tabEvents':
        return l10n.tabTasks;
      case 'tabMore':
        return l10n.tabMore;
      case 'tabExplore':
        return l10n.tabFamily;
      case 'tabProfile':
        return l10n.tabMe;
      case 'tabAi':
        return l10n.tabRewards;
      case 'tabTodos':
        return l10n.tabMe;
      default:
        // 新增 Tab 忘记加 labelKey 时尽早暴露，而不是静默渲染空标签
        assert(false, 'Unknown tab labelKey: $key');
        return '';
    }
  }
}

class _TabItem {
  final IconData icon;
  final String labelKey;

  const _TabItem({
    required this.icon,
    required this.labelKey,
  });
}
