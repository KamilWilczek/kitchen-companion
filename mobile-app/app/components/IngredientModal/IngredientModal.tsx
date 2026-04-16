import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
} from 'react-native';
import { AutocompleteInput } from '@app/components/AutocompleteInput/AutocompleteInput';
import UnitSelect from '@app/components/UnitSelect/UnitSelect';
import type { IngredientOut } from 'types/types';
import { s } from './IngredientModal.styles';

type Props = {
  visible: boolean;
  value: IngredientOut;
  onChange: (ing: IngredientOut) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onCategoryPress: () => void;
  isEditing: boolean;
};

export default function IngredientModal({
  visible,
  value,
  onChange,
  onSave,
  onDelete,
  onClose,
  onCategoryPress,
  isEditing,
}: Props) {
  const canSave = value.name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <Text style={s.title}>{isEditing ? 'Edit ingredient' : 'Add ingredient'}</Text>

          <View>
            <Text style={s.label}>Name</Text>
            <AutocompleteInput
              placeholder="e.g. Tomatoes"
              value={value.name}
              onChangeText={(t) => onChange({ ...value, name: t })}
            />
          </View>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Quantity</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                keyboardType="numeric"
                value={value.quantity > 0 ? String(value.quantity) : ''}
                onChangeText={(t) => onChange({ ...value, quantity: Number(t) || 0 })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Unit</Text>
              <UnitSelect
                value={value.unit}
                onChange={(u) => onChange({ ...value, unit: u })}
              />
            </View>
          </View>

          <View>
            <Text style={s.label}>Category</Text>
            <Pressable style={s.categoryChip} onPress={onCategoryPress}>
              <Text style={[s.categoryText, !value.category_id && s.categoryPlaceholder]}>
                {value.category
                  ? `${value.category.icon ?? '📦'} ${value.category.name}`
                  : '+ Add category'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[s.saveBtn, !canSave && s.disabled]}
            onPress={onSave}
            disabled={!canSave}
          >
            <Text style={s.saveBtnText}>Save</Text>
          </Pressable>

          {isEditing && (
            <Pressable style={s.deleteBtn} onPress={onDelete}>
              <Text style={s.deleteBtnText}>Remove ingredient</Text>
            </Pressable>
          )}

          <Pressable style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
