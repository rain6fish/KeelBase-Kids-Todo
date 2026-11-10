// SPDX-License-Identifier: Apache-2.0

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/utils/picked_file_path.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../upload/presentation/providers/upload_provider.dart';
import '../../data/models/task_model.dart';
import 'attachment_view.dart';

/// 任务表单弹层：新增与编辑共用。
///
/// [initial] 为空表示新增；有值表示编辑，字段预填并在保存时带回可清空的空值。
class TaskFormSheet extends StatefulWidget {
  const TaskFormSheet({
    super.key,
    required this.title,
    required this.onSubmit,
    this.initial,
    this.defaultDate,
  });

  final String title;
  final TaskModel? initial;
  final DateTime? defaultDate;

  /// 返回 true 表示已保存并关闭弹层；false 保持弹层，由调用方提示原因。
  final Future<bool> Function(Map<String, dynamic> data) onSubmit;

  @override
  State<TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<TaskFormSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _descriptionCtrl;
  late final TextEditingController _estimatedMinutesCtrl;
  late String _priority;
  late String _repeatRule;
  late DateTime _taskDate;
  String? _attachmentUrl;
  String? _attachmentName;
  bool _uploading = false;
  bool _submitting = false;

  bool get _editing => widget.initial != null;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    _titleCtrl = TextEditingController(text: initial?.title ?? '');
    _descriptionCtrl = TextEditingController(text: initial?.description ?? '');
    _estimatedMinutesCtrl =
        TextEditingController(text: initial?.estimatedMinutes?.toString() ?? '');
    _priority = initial?.priority ?? 'medium';
    _repeatRule = initial?.repeatRule ?? 'none';
    _attachmentUrl = initial?.attachmentUrl;
    _attachmentName = initial?.attachmentName;
    _taskDate = _dateOf(initial?.taskDate) ??
        widget.defaultDate ??
        DateTime.now();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    _estimatedMinutesCtrl.dispose();
    super.dispose();
  }

  static DateTime? _dateOf(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return null;
    return DateTime(dt.year, dt.month, dt.day);
  }

  String _formatDate(DateTime value) =>
      '${value.year}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';

  Future<void> _pickDate() async {
    var selected = _taskDate;
    await showCupertinoModalPopup<void>(
      context: context,
      builder: (pickerCtx) => Container(
        height: 300,
        color: CupertinoColors.systemBackground.resolveFrom(pickerCtx),
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CupertinoButton(
                    child: const Text('取消'),
                    onPressed: () => Navigator.pop(pickerCtx),
                  ),
                  CupertinoButton(
                    child: const Text('确定'),
                    onPressed: () {
                      setState(() => _taskDate = selected);
                      Navigator.pop(pickerCtx);
                    },
                  ),
                ],
              ),
              Expanded(
                child: CupertinoDatePicker(
                  mode: CupertinoDatePickerMode.date,
                  initialDateTime: _taskDate,
                  onDateTimeChanged: (v) => selected = v,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _chooseAttachment() async {
    final l10n = context.l10n;
    final source = await showCupertinoModalPopup<String>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text(l10n.taskAttachment),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () => Navigator.pop(ctx, 'camera'),
            child: Text(l10n.attachPhoto),
          ),
          CupertinoActionSheetAction(
            onPressed: () => Navigator.pop(ctx, 'gallery'),
            child: Text(l10n.attachFromAlbum),
          ),
          CupertinoActionSheetAction(
            onPressed: () => Navigator.pop(ctx, 'file'),
            child: Text(l10n.attachChooseFile),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: Text(l10n.cancel),
        ),
      ),
    );
    if (source == null || !mounted) return;

    if (source == 'file') {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const [
          'jpg', 'jpeg', 'png', 'gif', 'webp',
          'pdf', 'zip', 'docx', 'xlsx', 'pptx', 'txt',
        ],
        allowMultiple: false,
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;
      final path = pickedFilePath(file);
      if (path == null || !mounted) return;
      await _upload(path, file.name);
      return;
    }

    final picked = await ImagePicker().pickImage(
      source: source == 'camera' ? ImageSource.camera : ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (picked == null || !mounted) return;
    await _upload(picked.path, picked.name);
  }

  Future<void> _upload(String path, String name) async {
    setState(() => _uploading = true);
    final upload = context.read<UploadProvider>();
    upload.clear();
    final ok = await upload.uploadFile(path, name);
    if (!mounted) return;
    setState(() {
      _uploading = false;
      if (ok) {
        _attachmentUrl = upload.result?.url;
        _attachmentName = name;
      }
    });
    if (!ok && mounted) {
      AppToast.error(context, upload.error ?? context.l10n.unknownError);
    }
  }

  Future<void> _save() async {
    final title = _titleCtrl.text.trim();
    if (title.isEmpty) {
      AppToast.error(context, '请填写任务名称');
      return;
    }
    final data = <String, dynamic>{
      'title': title,
      'priority': _priority,
      'taskDate': _formatDate(_taskDate),
      'repeatRule': _repeatRule,
      'attachmentUrl': _attachmentUrl,
      'attachmentName': _attachmentName,
    };
    final description = _descriptionCtrl.text.trim();
    if (description.isNotEmpty) {
      data['description'] = description;
    } else if (_editing) {
      // 编辑时清空描述/时长要真的写回去，否则旧值会留在服务端。
      data['description'] = null;
      data['estimatedMinutes'] = null;
    }
    final minutes = int.tryParse(_estimatedMinutesCtrl.text.trim());
    if (minutes != null) data['estimatedMinutes'] = minutes;

    setState(() => _submitting = true);
    final ok = await widget.onSubmit(data);
    if (!mounted) return;
    if (ok) {
      Navigator.pop(context, true);
    } else {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      decoration: BoxDecoration(
        color: CupertinoColors.systemBackground.resolveFrom(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed:
                        _submitting ? null : () => Navigator.pop(context),
                    child: Text(l10n.cancel),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                children: [
                  _formLabel(l10n.tasksFieldTitle),
                  _formField(_titleCtrl, '例如：晨读 20 分钟'),
                  const SizedBox(height: 16),
                  _formLabel(l10n.tasksFieldDescription),
                  _formField(_descriptionCtrl, '可选', maxLines: 3),
                  const SizedBox(height: 16),
                  _formLabel(l10n.taskAttachment),
                  _attachmentField(l10n),
                  const SizedBox(height: 16),
                  _formLabel(l10n.tasksFieldPriority),
                  _segmented(
                    groupValue: _priority,
                    values: const ['low', 'medium', 'high'],
                    labelOf: l10n.priorityLabel,
                    onChanged: (v) => setState(() => _priority = v),
                  ),
                  const SizedBox(height: 16),
                  _formLabel(l10n.tasksFieldTaskDate),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _pickDate,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: CupertinoColors.tertiarySystemBackground
                            .resolveFrom(context),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(_formatDate(_taskDate)),
                          const Icon(CupertinoIcons.calendar, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _formLabel(l10n.tasksFieldEstimatedMinutes),
                  _formField(
                    _estimatedMinutesCtrl,
                    '例如：20',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  _formLabel(l10n.tasksFieldRepeatRule),
                  _segmented(
                    groupValue: _repeatRule,
                    values: const ['none', 'daily', 'weekly', 'monthly'],
                    labelOf: l10n.repeatRuleLabel,
                    onChanged: (v) => setState(() => _repeatRule = v),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: SizedBox(
                width: double.infinity,
                child: CupertinoButton.filled(
                  onPressed: _submitting ? null : _save,
                  child: _submitting
                      ? const CupertinoActivityIndicator()
                      : Text(l10n.save),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _removeAttachment() => setState(() {
        _attachmentUrl = null;
        _attachmentName = null;
      });

  Widget _attachmentField(AppLocalizations l10n) {
    if (_uploading) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            const CupertinoActivityIndicator(),
            const SizedBox(width: 8),
            Text(l10n.attachUploading),
          ],
        ),
      );
    }
    final url = _attachmentUrl ?? '';
    if (url.isEmpty) {
      return CupertinoButton(
        padding: const EdgeInsets.symmetric(vertical: 10),
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(10),
        onPressed: _chooseAttachment,
        child: Text(
          l10n.attachAdd,
          style: TextStyle(
            fontSize: 14,
            color: CupertinoTheme.of(context).primaryColor,
          ),
        ),
      );
    }
    final name = _attachmentName ?? url;
    if (isImageName(name)) {
      return Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              AppConstants.resolveUrl(url),
              width: double.infinity,
              height: 140,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 80,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: CupertinoColors.tertiarySystemBackground
                      .resolveFrom(context),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(name, maxLines: 2, overflow: TextOverflow.ellipsis),
              ),
            ),
          ),
          Positioned(
            top: 6,
            right: 6,
            child: CupertinoButton(
              padding: EdgeInsets.zero,
              minimumSize: const Size(28, 28),
              onPressed: _removeAttachment,
              child: Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: CupertinoColors.black.withAlpha(110),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  CupertinoIcons.xmark,
                  size: 14,
                  color: CupertinoColors.white,
                ),
              ),
            ),
          ),
        ],
      );
    }
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
      decoration: BoxDecoration(
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(
            attachmentIcon(name),
            size: 26,
            color: CupertinoTheme.of(context).primaryColor,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14),
            ),
          ),
          CupertinoButton(
            padding: EdgeInsets.zero,
            minimumSize: const Size(32, 32),
            onPressed: _removeAttachment,
            child: const Icon(
              CupertinoIcons.xmark_circle_fill,
              size: 20,
              color: CupertinoColors.systemGrey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _formLabel(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(
          text,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      );

  Widget _formField(
    TextEditingController controller,
    String hint, {
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
        borderRadius: BorderRadius.circular(10),
      ),
      child: CupertinoTextField(
        controller: controller,
        placeholder: hint,
        maxLines: maxLines,
        keyboardType: keyboardType,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  Widget _segmented({
    required String groupValue,
    required List<String> values,
    required String Function(String) labelOf,
    required ValueChanged<String> onChanged,
  }) {
    return CupertinoSlidingSegmentedControl<String>(
      groupValue: groupValue,
      onValueChanged: (v) {
        if (v != null) onChanged(v);
      },
      children: {
        for (final v in values)
          v: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            child: Text(labelOf(v), style: const TextStyle(fontSize: 12)),
          ),
      },
    );
  }
}
