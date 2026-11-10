// SPDX-License-Identifier: Apache-2.0

class DailyReviewModel {
  final int id;
  final String reviewDate;
  final String content;
  final int? rating;

  const DailyReviewModel({
    required this.id,
    required this.reviewDate,
    required this.content,
    this.rating,
  });

  factory DailyReviewModel.fromJson(Map<String, dynamic> json) {
    return DailyReviewModel(
      id: json['id'] as int? ?? 0,
      reviewDate: (json['reviewDate'] as String? ?? '').trim(),
      content: (json['content'] as String? ?? '').trim(),
      rating: json['rating'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'reviewDate': reviewDate,
        'content': content,
        'rating': rating,
      };

  DailyReviewModel copyWith({
    Object? reviewDate = const Object(),
    Object? content = const Object(),
    Object? rating = const Object()
  }) {
    return DailyReviewModel(
      id: id,
      reviewDate: reviewDate == const Object() ? this.reviewDate : reviewDate as dynamic,
      content: content == const Object() ? this.content : content as dynamic,
      rating: rating == const Object() ? this.rating : rating as dynamic,
    );
  }
}
