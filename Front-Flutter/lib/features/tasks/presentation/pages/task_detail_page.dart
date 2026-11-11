// SPDX-License-Identifier: Apache-2.0

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/i18n/app_localizations.dart';
import '../../../../core/utils/picked_file_path.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../task_notes/data/models/task_note_model.dart';
import '../../../upload/presentation/providers/upload_provider.dart';
import '../../data/models/task_model.dart';
import '../providers/tasks_provider.dart';
import '../widgets/attachment_view.dart';
import '../widgets/task_form_sheet.dart';

/// 任务详情 + 备注对话。
///
/// 家长写说明、孩子回复，都落在同一条 task_notes 时间线上；作者昵称由家庭成员
/// 列表解析，气泡按「是不是自己」左右分栏。
class TaskDetailPage extends StatefulWidget {
  const TaskDetailPage({super.key, required this.taskId});

  final int taskId;

  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  TaskModel? _task;
  Map<String, dynamic> _taskJson = const {};
  List<TaskNoteModel> _notes = [];
  List<Map<String, dynamic>> _history = [];
  Map<int, String> _memberNames = {};
  bool _historyExpanded = false;
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    try {
      final results = await Future.wait([
        api.get('/tasks/${widget.taskId}'),
        api.get('/task_notes', queryParameters: {'taskIdId': widget.taskId}),
        api.get('/auth/family'),
        api.get('/tasks/${widget.taskId}/history'),
      ]);
      final taskRaw = results[0];
      final notesRaw = results[1];
      final familyRaw = results[2];
      final historyRaw = results[3];
      final taskJson = taskRaw['data'] is Map
          ? Map<String, dynamic>.from(taskRaw['data'] as Map)
          : taskRaw;
      final family = familyRaw['data'] is Map
          ? Map<String, dynamic>.from(familyRaw['data'] as Map)
          : familyRaw;
      final members = <int, String>{};
      final memberList = (family['members'] as List?) ?? const [];
      for (final m in memberList) {
        if (m is Map && m['id'] is int) {
          members[m['id'] as int] = (m['nickname'] ?? m['username'] ?? '').toString();
        }
      }
      final List noteList = (notesRaw['data'] as List?) ?? const [];
      final List historyList = (historyRaw['data'] as List?) ?? const [];
      setState(() {
        _taskJson = taskJson;
        _task = _taskJson.isEmpty ? null : TaskModel.fromJson(_taskJson);
        _memberNames = members;
        _notes = noteList
            .whereType<Map>()
            .map((e) => TaskNoteModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        _history = historyList
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
      // 打开详情即视为读过该任务的备注
      context.read<TasksProvider>().markRead(widget.taskId);
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        AppToast.error(context, e.toString());
      }
    }
  }

  Future<void> _send() async {
    final content = _inputCtrl.text.trim();
    if (content.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final api = context.read<ApiClient>();
      final json = await api.post('/task_notes', data: {
        'taskIdId': widget.taskId,
        'content': content,
        'contentType': 'text',
      });
      final raw = json['data'] is Map ? json['data'] as Map : json;
      final note = TaskNoteModel.fromJson(Map<String, dynamic>.from(raw));
      if (!mounted) return;
      setState(() {
        _notes = [..._notes, note];
        _sending = false;
      });
      _inputCtrl.clear();
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        AppToast.error(context, e.toString());
      }
    }
  }

  Future<void> _delete() async {
    final l10n = context.l10n;
    final confirmed = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(l10n.tasksDeleteConfirm),
        actions: [
          CupertinoDialogAction(
            child: Text(l10n.cancel),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: Text(l10n.delete),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await context.read<ApiClient>().delete('/tasks/${widget.taskId}');
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) AppToast.error(context, e.toString());
    }
  }

  Future<void> _complete() async {
    try {
      await context.read<ApiClient>().patch('/tasks/${widget.taskId}/complete', data: const {});
      if (mounted) {
        AppToast.success(context, context.l10n.taskDone);
        await _load();
      }
    } catch (e) {
      if (mounted) AppToast.error(context, e.toString());
    }
  }

  /// 备注附件：拍照 / 相册 / 选文件，上传后发一条 image 或 file 备注。
  Future<void> _sendAttachment() async {
    if (_sending) return;
    final l10n = context.l10n;
    final kind = await showCupertinoModalPopup<String>(
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
    if (kind == null || !mounted) return;

    String? path;
    String? name;
    if (kind == 'file') {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const [
          'jpg', 'jpeg', 'png', 'gif', 'webp',
          'pdf', 'zip', 'docx', 'xlsx', 'pptx', 'txt',
        ],
        allowMultiple: false,
      );
      if (result == null || result.files.isEmpty) return;
      path = pickedFilePath(result.files.first);
      name = result.files.first.name;
    } else {
      final picked = await ImagePicker().pickImage(
        source: kind == 'camera' ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1600,
      );
      path = picked?.path;
      name = picked?.name;
    }
    if (path == null || name == null || !mounted) return;

    setState(() => _sending = true);
    try {
      final upload = context.read<UploadProvider>();
      upload.clear();
      final uploaded = await upload.uploadFile(path, name);
      if (!uploaded) {
        if (mounted) {
          setState(() => _sending = false);
          AppToast.error(context, upload.error ?? l10n.unknownError);
        }
        return;
      }
      final isImage = kind != 'file';
      final json = await context.read<ApiClient>().post('/task_notes', data: {
        'taskIdId': widget.taskId,
        'content': isImage ? l10n.noteImagePlaceholder : name,
        'contentType': isImage ? 'image' : 'file',
        'mediaUrl': upload.result!.url,
      });
      final raw = json['data'] is Map ? json['data'] as Map : json;
      final note = TaskNoteModel.fromJson(Map<String, dynamic>.from(raw));
      if (!mounted) return;
      setState(() {
        _notes = [..._notes, note];
        _sending = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        AppToast.error(context, e.toString());
      }
    }
  }

  Future<void> _edit() async {
    final task = _task;
    if (task == null) return;
    final saved = await showCupertinoModalPopup<bool>(
      context: context,
      builder: (_) => TaskFormSheet(
        title: context.l10n.tasksEditTitle,
        initial: task,
        onSubmit: (data) async {
          try {
            await context.read<ApiClient>().patch(
              '/tasks/${widget.taskId}',
              data: {...data, 'version': _taskJson['version']},
            );
            return true;
          } catch (e) {
            if (context.mounted) AppToast.error(context, e.toString());
            return false;
          }
        },
      ),
    );
    if (saved == true && mounted) await _load();
  }

  /// complete 是单向的（已完成再调直接原样返回），改回未完成走 uncomplete，同时回退积分结算。
  Future<void> _uncomplete() async {
    try {
      await context.read<ApiClient>().patch('/tasks/${widget.taskId}/uncomplete', data: const {});
      if (mounted) {
        AppToast.success(context, context.l10n.taskUndone);
        await _load();
      }
    } catch (e) {
      if (mounted) AppToast.error(context, e.toString());
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      _scrollCtrl.animateTo(
        _scrollCtrl.position.maxScrollExtent,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
  }

  String _authorName(int? userId) {
    if (userId == null) return '';
    return _memberNames[userId] ?? '';
  }

  String _authorLabel(TaskNoteModel note, bool mine) {
    final l10n = context.l10n;
    final meId = context.read<AuthProvider>().user?.id;
    var name = _authorName(note.userId);
    if (name.isEmpty && note.userId == meId) {
      name = context.read<AuthProvider>().user?.nickname ?? '';
    }
    if (name.isEmpty) name = l10n.noteAuthorUnknown;
    return mine ? '${l10n.noteAuthorMe} · $name' : name;
  }

  String _timeText(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _dateTimeText(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    return '${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  Widget _historyRow(BuildContext context, Map<String, dynamic> entry) {
    final l10n = context.l10n;
    final action = (entry['action'] ?? '').toString();
    final payload = entry['payload'];
    String? status;
    if (payload is Map && payload['status'] != null) {
      status = l10n.enumLabel(payload['status'].toString());
    }
    final grey = CupertinoColors.systemGrey.resolveFrom(context);
    final uid = entry['userId'] as int?;
    final me = context.read<AuthProvider>().user?.id;
    var actor = _authorName(uid);
    if (actor.isEmpty && uid == me) {
      actor = context.read<AuthProvider>().user?.nickname ?? '';
    }
    if (actor.isEmpty) {
      actor = uid == null ? l10n.taskHistorySystem : l10n.noteAuthorUnknown;
    }
    final actorLabel = uid == me ? '${l10n.noteAuthorMe} · $actor' : actor;
    final detail =
        '${l10n.taskHistoryAction(action)}${status != null ? ' · $status' : ''}';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$actorLabel  ',
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  TextSpan(
                    text: detail,
                    style: TextStyle(fontSize: 13, color: grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _dateTimeText(entry['createdAt']?.toString()),
            style: TextStyle(fontSize: 11, color: grey),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final user = context.watch<AuthProvider>().user;
    final me = user?.id;
    final task = _task;
    final isDone = task?.status == 'done';
    // 孩子只能编辑/删除自己创建的任务；家长可操作家庭内任何任务（与服务端一致）。
    final canModify = task != null &&
        (user?.familyRole != 'child' || task.userId == null || task.userId == me);

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        leading: CupertinoNavigationBarBackButton(
          previousPageTitle: l10n.tasksTitle,
          onPressed: () => context.canPop() ? context.pop() : context.go('/tasks'),
        ),
        middle: Text(l10n.taskDetailTitle),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isDone && canModify)
              CupertinoButton(
                padding: EdgeInsets.zero,
                minimumSize: const Size(32, 32),
                onPressed: _edit,
                child: Icon(
                  CupertinoIcons.pencil,
                  size: 20,
                  color: CupertinoTheme.of(context).primaryColor,
                ),
              ),
            if (canModify)
              CupertinoButton(
                padding: EdgeInsets.zero,
                minimumSize: const Size(32, 32),
                onPressed: _delete,
                child: const Icon(
                  CupertinoIcons.trash,
                  size: 20,
                  color: CupertinoColors.destructiveRed,
                ),
              ),
          ],
        ),
      ),
      child: SafeArea(
        child: _loading
            ? const Center(child: CupertinoActivityIndicator())
            : Column(
                children: [
                  Expanded(
                    child: ListView(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      children: [
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: CupertinoTheme.of(context).primaryColor.withAlpha(18),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                task?.title ?? '',
                                style: const TextStyle(
                                    fontSize: 24, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _chip(
                                    context,
                                    l10n.priorityLabel(task?.priority ?? 'medium'),
                                    CupertinoColors.systemOrange,
                                  ),
                                  _chip(
                                    context,
                                    l10n.enumLabel(task?.status ?? 'todo'),
                                    isDone
                                        ? CupertinoColors.activeGreen
                                        : CupertinoColors.systemBlue,
                                  ),
                                  if ((_taskJson['assigneeId'] as int?) != null)
                                    _chip(
                                      context,
                                      _memberNames[_taskJson['assigneeId'] as int] ?? '',
                                      CupertinoColors.systemPurple,
                                    ),
                                  if (task != null && !canModify)
                                    _chip(
                                      context,
                                      l10n.taskCreatedByParent,
                                      CupertinoColors.systemGrey,
                                    ),
                                ],
                              ),
                              if ((task?.description ?? '').isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Text(
                                  task!.description!,
                                  style: const TextStyle(fontSize: 15, height: 1.5),
                                ),
                              ],
                              if ((task?.attachmentUrl ?? '').isNotEmpty) ...[
                                const SizedBox(height: 12),
                                _taskAttachment(task!),
                              ],
                              if (!isDone) ...[
                                const SizedBox(height: 14),
                                SizedBox(
                                  width: double.infinity,
                                  child: CupertinoButton.filled(
                                    onPressed: _complete,
                                    child: Text(l10n.taskDone),
                                  ),
                                ),
                              ] else if (canModify) ...[
                                const SizedBox(height: 14),
                                SizedBox(
                                  width: double.infinity,
                                  child: CupertinoButton(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 14),
                                    color: CupertinoColors.systemGrey5
                                        .resolveFrom(context),
                                    borderRadius: BorderRadius.circular(12),
                                    onPressed: _uncomplete,
                                    child: Text(
                                      l10n.taskMarkUndone,
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: CupertinoTheme.of(context)
                                            .primaryColor,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          l10n.taskNotesTitle,
                          style: const TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 10),
                        if (_notes.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            child: Center(
                              child: Text(
                                l10n.taskNoteEmpty,
                                style: const TextStyle(
                                    color: CupertinoColors.systemGrey),
                              ),
                            ),
                          )
                        else
                          ..._notes.map((note) {
                            final mine = note.userId != null && note.userId == me;
                            return _bubble(context, note, mine);
                          }),
                        const SizedBox(height: 20),
                        GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => setState(
                              () => _historyExpanded = !_historyExpanded),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Row(
                              children: [
                                Text(
                                  l10n.taskHistoryTitle,
                                  style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600),
                                ),
                                if (_history.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(left: 6),
                                    child: Text(
                                      '(${_history.length})',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: CupertinoColors.systemGrey
                                            .resolveFrom(context),
                                      ),
                                    ),
                                  ),
                                const Spacer(),
                                Icon(
                                  _historyExpanded
                                      ? CupertinoIcons.chevron_up
                                      : CupertinoIcons.chevron_down,
                                  size: 18,
                                  color:
                                      CupertinoColors.systemGrey.resolveFrom(context),
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (_historyExpanded) ...[
                          const SizedBox(height: 4),
                          if (_history.isEmpty)
                            Text(
                              l10n.taskHistoryEmpty,
                              style: const TextStyle(
                                  color: CupertinoColors.systemGrey),
                            )
                          else
                            ..._history
                                .take(20)
                                .map((entry) => _historyRow(context, entry)),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.fromLTRB(
                      12,
                      8,
                      12,
                      8 + MediaQuery.of(context).padding.bottom,
                    ),
                    decoration: BoxDecoration(
                      color: CupertinoColors.systemBackground.resolveFrom(context),
                      border: Border(
                        top: BorderSide(
                          color: CupertinoColors.separator.resolveFrom(context),
                          width: 0.5,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: CupertinoTextField(
                            controller: _inputCtrl,
                            onTapOutside: (_) => FocusManager
                                .instance.primaryFocus
                                ?.unfocus(),
                            placeholder: l10n.taskNoteHint,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            maxLines: 4,
                            minLines: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        CupertinoButton(
                          padding: EdgeInsets.zero,
                          onPressed: _sending ? null : _sendAttachment,
                          child: Icon(
                            CupertinoIcons.camera,
                            color: CupertinoTheme.of(context).primaryColor,
                          ),
                        ),
                        const SizedBox(width: 4),
                        CupertinoButton(
                          padding: EdgeInsets.zero,
                          onPressed: _sending ? null : _send,
                          child: _sending
                              ? const CupertinoActivityIndicator()
                              : Icon(
                                  CupertinoIcons.paperplane_fill,
                                  color: CupertinoTheme.of(context).primaryColor,
                                ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _taskAttachment(TaskModel task) {
    final url = task.attachmentUrl ?? '';
    final name = task.attachmentName ?? url;
    if (isImageName(name)) {
      return GestureDetector(
        onTap: () => showImagePreview(context, url),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(
            AppConstants.resolveUrl(url),
            width: double.infinity,
            height: 180,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Text(
              name,
              style: TextStyle(
                fontSize: 13,
                color: CupertinoColors.systemGrey.resolveFrom(context),
              ),
            ),
          ),
        ),
      );
    }
    return GestureDetector(
      onTap: () => openAttachment(context, url),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: CupertinoColors.tertiarySystemBackground.resolveFrom(context),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              attachmentIcon(name),
              size: 28,
              color: CupertinoTheme.of(context).primaryColor,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 15),
              ),
            ),
            Icon(
              CupertinoIcons.chevron_right,
              size: 16,
              color: CupertinoColors.systemGrey.resolveFrom(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(BuildContext context, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withAlpha(24),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: TextStyle(fontSize: 12, color: color)),
    );
  }

  Widget _bubble(BuildContext context, TaskNoteModel note, bool mine) {
    final primary = CupertinoTheme.of(context).primaryColor;
    final text = note.content;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: mine
              ? primary.withAlpha(230)
              : CupertinoColors.tertiarySystemBackground.resolveFrom(context),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(mine ? 16 : 4),
            bottomRight: Radius.circular(mine ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _authorLabel(note, mine),
              style: TextStyle(
                fontSize: 11,
                color: mine
                    ? CupertinoColors.white.withAlpha(190)
                    : CupertinoColors.systemGrey,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (note.contentType == 'file' && (note.mediaUrl ?? '').isNotEmpty)
              GestureDetector(
                onTap: () => openAttachment(context, note.mediaUrl!),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      attachmentIcon(text),
                      size: 22,
                      color: mine
                          ? CupertinoColors.white
                          : CupertinoTheme.of(context).primaryColor,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 14,
                          color: mine ? CupertinoColors.white : null,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else ...[
              if ((note.mediaUrl ?? '').isNotEmpty) ...[
                const SizedBox(height: 2),
                GestureDetector(
                  onTap: () => showImagePreview(context, note.mediaUrl!),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      AppConstants.resolveUrl(note.mediaUrl),
                      width: 220,
                      height: 160,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                ),
              ],
              if (note.contentType != 'image')
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.4,
                    color: mine ? CupertinoColors.white : null,
                  ),
                ),
            ],
            const SizedBox(height: 4),
            Text(
              _timeText(note.createdAt),
              style: TextStyle(
                fontSize: 10,
                color: mine
                    ? CupertinoColors.white.withAlpha(180)
                    : CupertinoColors.systemGrey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
