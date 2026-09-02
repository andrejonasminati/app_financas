// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'pencil.circle.fill': 'edit',
  'checkmark.circle.fill': 'check-circle',
  'trash.fill': 'delete',
  'pencil.and.outline': 'edit',
  'internaldrive.fill': 'storage',
  'lock.fill': 'lock',
  'arrow.uturn.backward.circle.fill': 'restore',
  'list.bullet': 'format-list-bulleted',
  'list.bullet.indent': 'format-list-bulleted',
  'chart.bar.fill': 'bar-chart',
  'chart.pie.fill': 'pie-chart',
  'gearshape.fill': 'settings',
} as const;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
