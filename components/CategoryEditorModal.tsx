import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORY_EMOJIS } from '../lib/emojis';
import { useLanguage } from '../lib/i18n';
import { useAppTheme } from '../lib/theme';

type Props = {
  visible: boolean;
  initialLabel?: string;
  initialEmoji?: string;
  onClose: () => void;
  onSave: (label: string, emoji: string) => void;
  onDelete?: () => void;
};

export default function CategoryEditorModal({
  visible,
  initialLabel = '',
  initialEmoji = '💸',
  onClose,
  onSave,
  onDelete,
}: Props) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [label, setLabel] = useState(initialLabel);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setLabel(initialLabel);
      setEmoji(initialEmoji);
      setPickerOpen(false);
    }
  }, [visible, initialLabel, initialEmoji]);

  const canSave = label.trim().length > 0;

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    emojiPreview: {
      width: 56,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cream,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    emojiPreviewText: {
      fontSize: 24,
    },
    labelInput: {
      flex: 1,
      fontSize: 16,
      backgroundColor: colors.cream,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      color: colors.ink,
    },
    pickerHint: {
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 8,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
    emojiCell: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.cream,
    },
    emojiCellActive: {
      backgroundColor: colors.walnut,
    },
    emojiCellText: {
      fontSize: 20,
    },
    saveButton: {
      marginTop: 20,
      backgroundColor: colors.walnut,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      color: colors.cream,
      fontSize: 15,
      fontWeight: '700',
    },
    deleteButton: {
      marginTop: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: colors.bad,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{onDelete ? t('editCategory') : t('newCategory')}</Text>

          <View style={styles.row}>
            <Pressable
              style={styles.emojiPreview}
              onPress={() => setPickerOpen((open) => !open)}
              android_ripple={{ color: colors.rippleTint }}
            >
              <Text style={styles.emojiPreviewText}>{emoji}</Text>
            </Pressable>
            <TextInput
              style={styles.labelInput}
              value={label}
              onChangeText={setLabel}
              placeholder={t('categoryNamePlaceholder')}
              placeholderTextColor={colors.inkMuted}
              autoFocus={!onDelete}
            />
          </View>

          {pickerOpen ? (
            <>
              <Text style={styles.pickerHint}>{t('pickIcon')}</Text>
              <ScrollView style={{ maxHeight: 200 }}>
                <View style={styles.emojiGrid}>
                  {CATEGORY_EMOJIS.map((item, index) => (
                    <Pressable
                      key={`${item}-${index}`}
                      style={[styles.emojiCell, item === emoji && styles.emojiCellActive]}
                      onPress={() => {
                        setEmoji(item);
                        setPickerOpen(false);
                      }}
                      android_ripple={{ color: colors.rippleTint }}
                    >
                      <Text style={styles.emojiCellText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          ) : null}

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            disabled={!canSave}
            onPress={() => onSave(label.trim(), emoji.trim() || '💸')}
            android_ripple={{ color: colors.rippleTint }}
          >
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </Pressable>

          {onDelete ? (
            <Pressable style={styles.deleteButton} onPress={onDelete} android_ripple={{ color: colors.rippleTint }}>
              <Text style={styles.deleteButtonText}>{t('deleteCategoryTitle')}</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
