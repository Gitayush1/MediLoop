import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../../lib/theme';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = Colors.primary,
  label,
  sublabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.gray200}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        {label && (
          <Text style={[styles.label, { color }]} numberOfLines={1}>
            {label}
          </Text>
        )}
        {sublabel && (
          <Text style={styles.sublabel} numberOfLines={1}>
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  sublabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
