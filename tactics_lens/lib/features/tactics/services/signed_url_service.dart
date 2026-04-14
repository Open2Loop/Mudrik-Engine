import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../config/app_constants.dart';

class _CachedUrl {
  final String url;
  final DateTime expiresAt;

  _CachedUrl({required this.url, required this.expiresAt});

  bool get isValid =>
      expiresAt.difference(DateTime.now()).inMinutes >
      AppConstants.signedUrlRefreshThresholdMinutes;
}

class SignedUrlService {
  final _supabase = Supabase.instance.client;
  final _cache = <String, _CachedUrl>{};

  Future<String> getSignedUrl(String tacticId) async {
    final cached = _cache[tacticId];
    if (cached != null && cached.isValid) {
      return cached.url;
    }

    final response = await _supabase.functions.invoke(
      'tl-video-signed-url',
      body: {'tactic_id': tacticId},
    );

    if (response.status != 200) {
      throw Exception('Failed to get signed URL: ${response.status}');
    }

    final data = response.data as Map<String, dynamic>;
    final signedUrl = data['signed_url'] as String;
    final expiresAt = DateTime.parse(data['expires_at'] as String);

    _cache[tacticId] = _CachedUrl(url: signedUrl, expiresAt: expiresAt);
    return signedUrl;
  }

  void invalidate(String tacticId) {
    _cache.remove(tacticId);
  }

  void clearCache() {
    _cache.clear();
  }
}
