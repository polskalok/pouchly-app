import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../lib/theme';

export type DropdownOption<T extends string> = {
  key: T;
  label: string;
  emoji?: string;
};

type Props<T extends string> = {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
};

export default function Dropdown<T extends string>({ label, value, options, onChange }: Props<T>) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === value);

  const styles = StyleSheet.create({
    field: {
      flex: 1,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    fieldLabel: {
      fontSize: 12,
      color: colors.inkMuted,
    },
    fieldValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.ink,
      marginTop: 2,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '60%',
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 8,
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    optionActive: {
      backgroundColor: colors.sand,
    },
    optionText: {
      fontSize: 15,
      color: colors.ink,
    },
  });

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)} android_ripple={{ color: colors.rippleTint }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue} numberOfLines={1}>
          {selected?.emoji ? `${selected.emoji} ` : ''}
          {selected?.label ?? 'Select'}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.key}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.key === value && styles.optionActive]}
                  onPress={() => {
                    onChange(item.key);
                    setOpen(false);
                  }}
                  android_ripple={{ color: colors.rippleTint }}
                >
                  <Text style={styles.optionText}>
                    {item.emoji ? `${item.emoji} ` : ''}
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
