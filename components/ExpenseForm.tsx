import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  addCategory,
  addTransaction,
  deleteCategory,
  deleteTransaction,
  getCategories,
  getTransactionById,
  updateCategory,
  updateTransaction,
  type Category,
} from '../lib/db';
import { captureCurrentLocation, reverseGeocode } from '../lib/location';
import { setLocationPickListener } from '../lib/locationPickerBus';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';
import CategoryEditorModal from './CategoryEditorModal';

type Props = {
  transactionId?: number | null;
  onSaved: () => void;
  onDeleted?: () => void;
};

export default function ExpenseForm({ transactionId, onSaved, onDeleted }: Props) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const isEditing = transactionId != null;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeName, setPlaceName] = useState<string>('');
  const [locating, setLocating] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  function reloadCategories() {
    getCategories().then((list) => {
      setCategories(list);
      setCategory((current) => current || list[0]?.key || '');
    });
  }

  useEffect(() => {
    reloadCategories();
  }, []);

  useEffect(() => {
    if (transactionId == null) return;
    getTransactionById(transactionId).then((existing) => {
      if (existing) {
        setAmount(String(existing.amount));
        setCategory(existing.category);
        setNote(existing.note);
        setLatitude(existing.latitude);
        setLongitude(existing.longitude);
        setPlaceName(existing.place_name ?? '');
      }
      setLoading(false);
    });
  }, [transactionId]);

  useEffect(() => {
    if (transactionId != null) return;
    setLocating(true);
    captureCurrentLocation()
      .then((captured) => {
        if (captured) {
          setLatitude(captured.latitude);
          setLongitude(captured.longitude);
          setPlaceName(captured.placeName ?? '');
        }
      })
      .finally(() => setLocating(false));
  }, [transactionId]);

  async function handleUpdateLocation() {
    setLocating(true);
    try {
      const captured = await captureCurrentLocation();
      if (captured) {
        setLatitude(captured.latitude);
        setLongitude(captured.longitude);
        setPlaceName(captured.placeName ?? '');
      } else {
        Alert.alert(t('couldntGetLocation'), t('checkLocationPermission'));
      }
    } finally {
      setLocating(false);
    }
  }

  function handleClearLocation() {
    setLatitude(null);
    setLongitude(null);
    setPlaceName('');
  }

  useEffect(() => {
    setLocationPickListener((coords) => {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      reverseGeocode(coords.latitude, coords.longitude).then((name) => {
        if (name) setPlaceName(name);
      });
    });
    return () => setLocationPickListener(null);
  }, []);

  function handlePointOnMap() {
    const query = latitude != null && longitude != null ? `&lat=${latitude}&lng=${longitude}` : '';
    router.push(`/location-picker?x=1${query}`);
  }

  function handleAddCategoryPress() {
    setEditingCategory(null);
    setEditorVisible(true);
  }

  function handleCategoryLongPress(c: Category) {
    setEditingCategory(c);
    setEditorVisible(true);
  }

  async function handleSaveCategory(label: string, emoji: string) {
    if (editingCategory) {
      await updateCategory(editingCategory.key, label, emoji);
    } else {
      await addCategory(label, emoji);
    }
    setEditorVisible(false);
    reloadCategories();
  }

  function handleDeleteCategory() {
    if (!editingCategory) return;
    if (categories.length <= 1) {
      Alert.alert(t('cantDelete'), t('needOneCategory'));
      return;
    }
    Alert.alert(t('deleteCategoryTitle'), t('deleteCategoryMessage', { label: editingCategory.label }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(editingCategory.key);
          setEditorVisible(false);
          if (category === editingCategory.key) setCategory('');
          reloadCategories();
        },
      },
    ]);
  }

  const parsedAmount = Number(amount.replace(',', '.'));
  const canSave = amount.length > 0 && !Number.isNaN(parsedAmount) && parsedAmount > 0 && category.length > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const input = {
        amount: parsedAmount,
        category,
        note: note.trim(),
        latitude,
        longitude,
        placeName: placeName.trim() || null,
      };

      if (isEditing && transactionId != null) {
        await updateTransaction(transactionId, input);
      } else {
        await addTransaction(input);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (transactionId == null) return;
    Alert.alert(t('deleteExpense'), t('cannotBeUndone'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transactionId);
          onDeleted?.();
        },
      },
    ]);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    content: {
      padding: 20,
    },
    heading: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.inkMuted,
      marginBottom: 8,
      marginTop: 20,
    },
    amountInput: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.ink,
      paddingVertical: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    chipActive: {
      backgroundColor: colors.walnut,
      borderColor: colors.walnut,
    },
    chipEmoji: {
      fontSize: 16,
    },
    chipLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
    },
    chipLabelActive: {
      color: colors.cream,
    },
    addChip: {
      backgroundColor: colors.cream,
      borderWidth: 1,
      borderColor: colors.tan,
      borderStyle: 'dashed',
    },
    addChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.inkMuted,
    },
    hintText: {
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 8,
    },
    noteInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.paper,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.ink,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    locationInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.paper,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.ink,
    },
    locationButtonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    locationButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.ink,
    },
    saveButton: {
      marginTop: 32,
      backgroundColor: colors.walnut,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      color: colors.cream,
      fontSize: 16,
      fontWeight: '700',
    },
    deleteButton: {
      marginTop: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: colors.bad,
      fontSize: 15,
      fontWeight: '600',
    },
  });

  if (loading) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.heading}>{isEditing ? t('editExpense') : t('newExpense')}</Text>

      <Text style={styles.label}>{t('amount')}</Text>
      <TextInput
        style={styles.amountInput}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor={colors.inkMuted}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <Text style={styles.label}>{t('categoryField')}</Text>
      <View style={styles.chipRow}>
        {categories.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setCategory(c.key)}
            onLongPress={() => handleCategoryLongPress(c)}
            style={[styles.chip, category === c.key && styles.chipActive]}
            android_ripple={{ color: colors.rippleTint }}
          >
            <Text style={styles.chipEmoji}>{c.emoji}</Text>
            <Text
              style={[
                styles.chipLabel,
                category === c.key && styles.chipLabelActive,
              ]}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.chip, styles.addChip]}
          onPress={handleAddCategoryPress}
          android_ripple={{ color: colors.rippleTint }}
        >
          <Text style={styles.addChipText}>{t('newCategoryChip')}</Text>
        </Pressable>
      </View>
      <Text style={styles.hintText}>{t('longPressHint')}</Text>

      <Text style={styles.label}>{t('noteOptional')}</Text>
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder={t('notePlaceholder')}
        placeholderTextColor={colors.inkMuted}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <Text style={styles.label}>{t('location')}</Text>
      <View style={styles.locationRow}>
        <TextInput
          style={styles.locationInput}
          value={placeName}
          onChangeText={setPlaceName}
          placeholder={t('noLocationSet')}
          placeholderTextColor={colors.inkMuted}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {locating ? <ActivityIndicator color={colors.inkMuted} /> : null}
      </View>
      <View style={styles.locationButtonsRow}>
        <Pressable
          style={styles.locationButton}
          onPress={handleUpdateLocation}
          disabled={locating}
          android_ripple={{ color: colors.rippleTint }}
        >
          <Text style={styles.locationButtonText}>{t('useCurrentLocation')}</Text>
        </Pressable>
        <Pressable style={styles.locationButton} onPress={handlePointOnMap} android_ripple={{ color: colors.rippleTint }}>
          <Text style={styles.locationButtonText}>{t('pointOnMap')}</Text>
        </Pressable>
        {placeName || latitude != null ? (
          <Pressable style={styles.locationButton} onPress={handleClearLocation} android_ripple={{ color: colors.rippleTint }}>
            <Text style={styles.locationButtonText}>{t('clear')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.hintText}>{t('locationHint')}</Text>

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave || saving}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <Text style={styles.saveButtonText}>
          {saving ? t('saving') : isEditing ? t('saveChanges') : t('saveExpense')}
        </Text>
      </Pressable>

      {isEditing ? (
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          android_ripple={{ color: 'rgba(220,38,38,0.1)' }}
        >
          <Text style={styles.deleteButtonText}>{t('deleteExpense')}</Text>
        </Pressable>
      ) : null}

      <CategoryEditorModal
        visible={editorVisible}
        initialLabel={editingCategory?.label}
        initialEmoji={editingCategory?.emoji}
        onClose={() => setEditorVisible(false)}
        onSave={handleSaveCategory}
        onDelete={editingCategory ? handleDeleteCategory : undefined}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
