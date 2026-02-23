import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getFoodByBarcode } from '../../services/foodService';
import Button from '../../components/common/Button';

export default function BarcodeScannerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBarcodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsLoading(true);
    setError(null);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const result = await getFoodByBarcode(data);
      if (result.food) {
        router.replace({
          pathname: '/(modals)/food-detail',
          params: {
            foodId: result.food.external_food_id,
            source: result.food.food_source ?? result.source,
            barcode: data,
            prefetchedFood: JSON.stringify(result.food),
          },
        });
      } else {
        setError('Product not found. Try searching manually.');
        setIsLoading(false);
      }
    } catch {
      setError('Failed to look up barcode. Please try again.');
      setIsLoading(false);
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[typography.h4, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
            Camera Access Needed
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
            We need camera access to scan barcodes on food packages.
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button title="Grant Camera Access" onPress={requestPermission} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Bottom info */}
        <View style={[styles.bottomBar, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={[typography.body, { color: '#FFFFFF', marginLeft: spacing.md }]}>
                Looking up product...
              </Text>
            </View>
          ) : error ? (
            <View>
              <Text style={[typography.body, { color: '#FFFFFF', textAlign: 'center' }]}>{error}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: spacing.md }}>
                <Button title="Scan Again" onPress={() => { setScanned(false); setError(null); }} variant="secondary" size="sm" />
                <Button title="Search Manually" onPress={() => { router.replace('/(modals)/food-search'); }} size="sm" />
              </View>
            </View>
          ) : (
            <Text style={[typography.body, { color: '#FFFFFF', textAlign: 'center' }]}>
              Point camera at a barcode
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 280,
    height: 180,
    alignSelf: 'center',
    marginTop: '40%',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  bottomBar: {
    padding: 24,
    paddingBottom: 48,
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
