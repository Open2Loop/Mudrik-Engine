class AppConstants {
  static const int freeScansPerDay = 3;
  static const int freeVideosPerDay = 3;
  static const int aiFallbackDailyLimit = 20;
  static const int signedUrlExpirySeconds = 3600;
  static const int signedUrlRefreshThresholdMinutes = 5;
  static const Duration ocrTimeout = Duration(seconds: 15);
  static const Duration aiSuggestionTimeout = Duration(seconds: 10);
  static const int maxMatchResults = 10;
  static const double minMatchScore = 0.3;
}
