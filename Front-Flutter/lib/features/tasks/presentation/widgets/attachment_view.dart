// SPDX-License-Identifier: Apache-2.0

import 'package:flutter/cupertino.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/widgets/app_toast.dart';

/// 常见可预览图片后缀。
bool isImageName(String? name) {
  final path = (name ?? '').split('?').first.toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      .any((ext) => path.endsWith(ext));
}

/// 按后缀挑一个文件图标。
IconData attachmentIcon(String? name) {
  final path = (name ?? '').toLowerCase();
  if (path.endsWith('.pdf')) return CupertinoIcons.doc_text;
  if (path.endsWith('.zip')) return CupertinoIcons.archivebox;
  if (path.endsWith('.txt')) return CupertinoIcons.doc_plaintext;
  return CupertinoIcons.doc;
}

/// 全屏图片预览（可缩放）。
Future<void> showImagePreview(BuildContext context, String url) {
  return Navigator.of(context).push(
    CupertinoPageRoute<void>(builder: (_) => _ImagePreviewPage(url: url)),
  );
}

/// 用系统外部应用打开附件（PDF/ZIP/Office 文档等）。
Future<void> openAttachment(BuildContext context, String url) async {
  final target = Uri.parse(AppConstants.resolveUrl(url));
  try {
    final ok = await launchUrl(target, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      AppToast.error(context, context.l10n.attachmentOpenFailed);
    }
  } catch (_) {
    if (context.mounted) {
      AppToast.error(context, context.l10n.attachmentOpenFailed);
    }
  }
}

class _ImagePreviewPage extends StatelessWidget {
  const _ImagePreviewPage({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CupertinoColors.black,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: CupertinoColors.black,
        border: null,
        middle: Text(
          context.l10n.attachmentPreview,
          style: const TextStyle(color: CupertinoColors.white),
        ),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () => Navigator.pop(context),
          child: const Icon(CupertinoIcons.xmark, color: CupertinoColors.white),
        ),
      ),
      child: SafeArea(
        child: InteractiveViewer(
          minScale: 1,
          maxScale: 4,
          child: Center(
            child: Image.network(
              AppConstants.resolveUrl(url),
              fit: BoxFit.contain,
              loadingBuilder: (context, child, progress) => progress == null
                  ? child
                  : const CupertinoActivityIndicator(
                      color: CupertinoColors.white),
              errorBuilder: (context, _, __) => Text(
                context.l10n.attachmentOpenFailed,
                style: const TextStyle(color: CupertinoColors.systemGrey),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
