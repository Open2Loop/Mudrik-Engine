import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/tactic_model.dart';
import '../services/signed_url_service.dart';
import '../../../models/category_model.dart';

final signedUrlServiceProvider = Provider<SignedUrlService>((ref) {
  return SignedUrlService();
});

final signedUrlProvider =
    FutureProvider.family<String, String>((ref, tacticId) async {
  final service = ref.read(signedUrlServiceProvider);
  return service.getSignedUrl(tacticId);
});

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final response = await Supabase.instance.client
      .from('tl_categories')
      .select()
      .order('display_order');

  return (response as List)
      .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
      .toList();
});

final tacticsByCategoryProvider =
    FutureProvider.family<List<TacticModel>, String>((ref, categoryId) async {
  final response = await Supabase.instance.client
      .from('tl_tactics')
      .select()
      .eq('category_id', categoryId)
      .order('created_at', ascending: false);

  return (response as List)
      .map((e) => TacticModel.fromJson(e as Map<String, dynamic>))
      .toList();
});

final favoriteTacticsProvider = FutureProvider<List<TacticModel>>((ref) async {
  final userId = Supabase.instance.client.auth.currentUser?.id;
  if (userId == null) return [];

  final response = await Supabase.instance.client
      .from('tl_favorites')
      .select('tactic_id, tl_tactics(*)')
      .eq('user_id', userId);

  return (response as List).map((e) {
    return TacticModel.fromJson(e['tl_tactics'] as Map<String, dynamic>);
  }).toList();
});

class FavoriteNotifier extends StateNotifier<Set<String>> {
  FavoriteNotifier() : super({});
  final _supabase = Supabase.instance.client;

  Future<void> loadFavorites() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final response = await _supabase
        .from('tl_favorites')
        .select('tactic_id')
        .eq('user_id', userId);

    state = (response as List)
        .map((e) => e['tactic_id'] as String)
        .toSet();
  }

  Future<void> toggle(String tacticId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    if (state.contains(tacticId)) {
      await _supabase
          .from('tl_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('tactic_id', tacticId);
      state = {...state}..remove(tacticId);
    } else {
      await _supabase.from('tl_favorites').insert({
        'user_id': userId,
        'tactic_id': tacticId,
      });
      state = {...state, tacticId};
    }
  }

  bool isFavorite(String tacticId) => state.contains(tacticId);
}

final favoriteNotifierProvider =
    StateNotifierProvider<FavoriteNotifier, Set<String>>((ref) {
  final notifier = FavoriteNotifier();
  notifier.loadFavorites();
  return notifier;
});
