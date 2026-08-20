import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../../lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
      accessibilityLabel="Loading"
    />
  );
};

// Pre-built skeleton layouts
export const MedicationCardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardSkeletonRow}>
      <Skeleton width={40} height={40} borderRadius={BorderRadius.lg} />
      <View style={styles.cardSkeletonContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={BorderRadius.full} />
    </View>
    <Skeleton width="100%" height={1} style={{ marginTop: 12 }} />
    <View style={[styles.cardSkeletonRow, { marginTop: 10 }]}>
      <Skeleton width="30%" height={12} />
      <Skeleton width="30%" height={12} />
      <Skeleton width="20%" height={12} />
    </View>
  </View>
);

export const DoseCardSkeleton: React.FC = () => (
  <View style={styles.doseCardSkeleton}>
    <Skeleton width={44} height={44} borderRadius={BorderRadius.lg} />
    <View style={styles.doseCardContent}>
      <Skeleton width="50%" height={14} />
      <Skeleton width="35%" height={11} style={{ marginTop: 5 }} />
    </View>
    <Skeleton width={80} height={32} borderRadius={BorderRadius.md} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.gray200,
  },
  cardSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardSkeletonContent: {
    flex: 1,
    gap: 6,
  },
  doseCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doseCardContent: {
    flex: 1,
  },
});
