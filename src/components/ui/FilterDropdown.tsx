import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { GREEN } from '../../theme';

export interface DropdownOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  label: string;
  selectedValue: T;
  defaultValue: T;
  options: DropdownOption<T>[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (value: T) => void;
}

export function FilterDropdown<T>({
  label,
  selectedValue,
  defaultValue,
  options,
  isOpen,
  onToggle,
  onChange,
}: Props<T>) {
  const { theme } = useTheme();
  const { surface, border, text, text2, text3 } = theme.colors;

  const selected = options.find(o => o.value === selectedValue);
  const isFiltered = selectedValue !== defaultValue;
  const buttonLabel = isFiltered ? selected?.label ?? label : label;

  return (
    <View style={styles.wrapper}>
      {/* Button */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={[
          styles.button,
          { borderColor: isFiltered ? GREEN : border, backgroundColor: surface },
          isFiltered && styles.buttonActive,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: isFiltered ? '#fff' : text2 },
          ]}
          numberOfLines={1}
        >
          {buttonLabel}
        </Text>
        <Text style={[styles.chevron, { color: isFiltered ? '#fff' : text3 }]}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Dropdown */}
      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: surface, borderColor: border }]}>
          {options.map((opt, i) => {
            const isSelected = opt.value === selectedValue;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => onChange(opt.value)}
                style={[
                  styles.option,
                  i < options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, { color: isSelected ? GREEN : text }]}>
                  {opt.label}
                </Text>
                {isSelected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  buttonActive: {
    backgroundColor: GREEN,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  chevron: {
    fontSize: 8,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 5,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
    overflow: 'hidden',
    zIndex: 100,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  check: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
  },
});
