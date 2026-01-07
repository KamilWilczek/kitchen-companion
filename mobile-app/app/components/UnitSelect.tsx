import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  Modal,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  findNodeHandle,
} from 'react-native';
import { UNITS } from '../constants';

type UnitSelectProps = {
  value: string;
  onChange: (u: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle | ViewStyle[];
};

type Anchor = { x: number; y: number; width: number; height: number };

export function UnitSelect({
  value,
  onChange,
  placeholder = 'Unit',
  containerStyle,
}: UnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const btnRef = useRef<View>(null);

  const screen = Dimensions.get('window');

  const openMenu = () => {
    const node = findNodeHandle(btnRef.current);
    if (!node) return;

    btnRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const closeMenu = () => setOpen(false);

  const menuStyle = useMemo(() => {
    if (!anchor) return null;

    const maxHeight = Math.min(260, screen.height * 0.4);
    const top = anchor.y + anchor.height + 6;

    const left = Math.max(12, Math.min(anchor.x, screen.width - anchor.width - 12));

    return {
      position: 'absolute' as const,
      top,
      left,
      width: anchor.width,
      maxHeight,
    };
  }, [anchor, screen.height, screen.width]);

  return (
    <View style={[s.unitSelectContainer, containerStyle]}>
      <Pressable ref={btnRef} onPress={openMenu} style={s.unitSelect}>
        <Text style={s.unitSelectText}>{value || placeholder}</Text>
        <Text style={s.unitSelectChevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={s.backdrop} />
        </TouchableWithoutFeedback>

        {menuStyle && (
          <View style={[s.unitOptions, menuStyle]}>
            <ScrollView>
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    onChange(u);
                    closeMenu();
                  }}
                  style={s.unitOption}
                >
                  <Text>{u}</Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => {
                  onChange('');
                  closeMenu();
                }}
                style={[s.unitOption, s.unitOptionClear]}
              >
                <Text style={{ color: '#b91c1c' }}>Clear unit</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  unitSelectContainer: {
    position: 'relative',
  },
  unitSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    minHeight: 42,
  },
  unitSelectText: { color: '#111827' },
  unitSelectChevron: { marginLeft: 6, color: '#6b7280' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  unitOptions: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 30,
  },
  unitOption: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  unitOptionClear: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default UnitSelect;
