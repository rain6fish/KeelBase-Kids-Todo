// SPDX-License-Identifier: Apache-2.0

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

/// FilePicker 选中的文件在 Web 上没有文件路径（`path` 恒为 null），
/// 其 `xFile.path` 是 blob 地址；原生端仍返回真实路径。
/// 上传层按 blob 地址读字节（见 ApiClient.uploadFile）。
String? pickedFilePath(PlatformFile file) =>
    kIsWeb ? file.xFile.path : file.path;
