import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:io';

class RevenueCatConfig {
  static String get apiKey {
    if (Platform.isIOS) {
      return dotenv.env['REVENUECAT_API_KEY_IOS'] ?? '';
    }
    return dotenv.env['REVENUECAT_API_KEY_ANDROID'] ?? '';
  }

  static const String monthlyId = 'tl_monthly_9';
  static const String zanqaId = 'tl_zanqa_29';
  static const String entitlementId = 'premium';
}
