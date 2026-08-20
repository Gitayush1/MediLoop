import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, Shadow } from '../../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: number; // 0-1 fraction of screen height
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  snapPoint = 0.6,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: SCREEN_HEIGHT * snapPoint },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close sheet">
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    ...Shadow.lg,
    minHeight: 200,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    fontSize: 16,
    color: Colors.textSecondary,
    padding: Spacing[1],
  },
  content: {
    padding: Spacing[5],
  },
});
