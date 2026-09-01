import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { billService, masterService } from '../../services/api';
import Header from '../../components/Header';
import SelectPicker from '../../components/SelectPicker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import colors from '../../theme/colors';

const NewBillScreen = () => {
  const { t } = useTranslation();

  // Form State
  const [vendors, setVendors] = useState([]);
  const [flowers, setFlowers] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedFlowerId, setSelectedFlowerId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [ratePerKg, setRatePerKg] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Receipt Modal
  const [savedBill, setSavedBill] = useState(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // Load masters on screen focus
  const loadMasters = async () => {
    try {
      const [vendorRes, flowerRes] = await Promise.all([
        masterService.getVendors(),
        masterService.getFlowers(),
      ]);
      setVendors(
        vendorRes.data.map((v) => ({
          id: v.id,
          label: v.vendorName,
          subtitle: v.contactInfo || '',
        }))
      );
      setFlowers(
        flowerRes.data.map((f) => ({
          id: f.id,
          label: f.flowerName,
        }))
      );
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMasters();
    }, [])
  );

  // Live total auto-calculation
  useEffect(() => {
    const w = parseFloat(weightKg);
    const r = parseFloat(ratePerKg);
    if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
      const total = Math.round(w * r * 100) / 100;
      setCalculatedTotal(total);
    } else {
      setCalculatedTotal(0);
    }
  }, [weightKg, ratePerKg]);

  const validateForm = () => {
    const newErrors = {};
    if (!selectedVendorId) newErrors.vendor = t('billing.selectVendorWarning');
    if (!selectedFlowerId) newErrors.flower = t('billing.selectFlowerWarning');

    const w = parseFloat(weightKg);
    if (!weightKg || isNaN(w) || w <= 0) {
      newErrors.weight = t('billing.invalidWeightWarning');
    }

    const r = parseFloat(ratePerKg);
    if (!ratePerKg || isNaN(r) || r <= 0) {
      newErrors.rate = t('billing.invalidRateWarning');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveBill = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        vendorId: selectedVendorId,
        flowerId: selectedFlowerId,
        weightKg: parseFloat(weightKg),
        ratePerKg: parseFloat(ratePerKg),
        date: new Date().toISOString(),
      };

      const response = await billService.createBill(payload);
      setSavedBill(response.data);
      setReceiptModalVisible(true);

      // Reset form fields
      setWeightKg('');
      setRatePerKg('');
      setCalculatedTotal(0);
      setErrors({});
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.error || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!savedBill) return;

    const dateFormatted = new Date(savedBill.date).toLocaleString();
    const htmlContent = `
      <html>
        <head>
          <title>APL Flower Bill - ${savedBill.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; text-align: center; color: #111; }
            .ticket { border: 2px dashed #15803d; padding: 25px; border-radius: 12px; max-width: 380px; margin: auto; }
            .header { color: #15803d; margin: 0 0 5px 0; font-size: 22px; }
            .date { font-size: 12px; color: #666; margin-top: 0; }
            hr { border: none; border-top: 1px solid #ddd; margin: 15px 0; }
            table { width: 100%; text-align: left; font-size: 14px; line-height: 26px; }
            .right { text-align: right; }
            .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #15803d; margin-top: 10px; }
            .footer { font-size: 11px; color: #888; margin-top: 25px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2 class="header">APL FLOWER BILLING</h2>
            <p class="date">Date: ${dateFormatted}</p>
            <hr />
            <table>
              <tr><td><strong>Vendor:</strong></td><td class="right">${savedBill.vendor?.vendorName || 'N/A'}</td></tr>
              <tr><td><strong>Flower:</strong></td><td class="right">${savedBill.flower?.flowerName || 'N/A'}</td></tr>
              <tr><td><strong>Weight:</strong></td><td class="right">${savedBill.weightKg} kg</td></tr>
              <tr><td><strong>Rate / kg:</strong></td><td class="right">Rs. ${Number(savedBill.ratePerKg).toFixed(2)}</td></tr>
            </table>
            <hr />
            <div class="total-row">
              <span>TOTAL AMOUNT:</span>
              <span>Rs. ${Number(savedBill.totalAmount).toFixed(2)}</span>
            </div>
            <p class="footer">Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          const printWindow = window.open('', '', 'width=600,height=600');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          } else {
            await Print.printAsync({ html: htmlContent });
          }
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.error('Error sharing receipt:', e);
      Alert.alert(t('common.error'), t('reports.shareFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title={t('billing.title')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.responsiveContainer}>
            {/* Main Billing Form Card */}
            <Card style={styles.formCard}>
              {/* Vendor Selector */}
              <SelectPicker
                label={t('billing.vendorLabel')}
                items={vendors}
                selectedValue={selectedVendorId}
                onValueChange={(id) => {
                  setSelectedVendorId(id);
                  setErrors((prev) => ({ ...prev, vendor: null }));
                }}
                placeholder={t('billing.vendorLabel')}
                required
                error={errors.vendor}
              />

              {/* Flower Variety Selector */}
              <SelectPicker
                label={t('billing.flowerLabel')}
                items={flowers}
                selectedValue={selectedFlowerId}
                onValueChange={(id) => {
                  setSelectedFlowerId(id);
                  setErrors((prev) => ({ ...prev, flower: null }));
                }}
                placeholder={t('billing.flowerLabel')}
                required
                error={errors.flower}
              />

              {/* Inputs: Weight & Rate */}
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('billing.weightLabel')}
                    value={weightKg}
                    onChangeText={(text) => {
                      setWeightKg(text);
                      setErrors((prev) => ({ ...prev, weight: null }));
                    }}
                    placeholder={t('billing.weightPlaceholder')}
                    keyboardType="numeric"
                    icon={<MaterialCommunityIcons name="scale" size={18} color={colors.textSecondary} />}
                    required
                    error={errors.weight}
                  />
                </View>

                <View style={{ width: 12 }} />

                <View style={{ flex: 1 }}>
                  <Input
                    label={t('billing.rateLabel')}
                    value={ratePerKg}
                    onChangeText={(text) => {
                      setRatePerKg(text);
                      setErrors((prev) => ({ ...prev, rate: null }));
                    }}
                    placeholder={t('billing.ratePlaceholder')}
                    keyboardType="numeric"
                    icon={<FontAwesome5 name="rupee-sign" size={16} color={colors.textSecondary} />}
                    required
                    error={errors.rate}
                  />
                </View>
              </View>

              {/* Auto-Calculated Total Banner */}
              <View style={styles.totalBanner}>
                <Text style={styles.totalLabel}>{t('billing.totalAmount')}</Text>
                <Text style={styles.totalValue}>
                  ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Submit Button */}
              <Button
                title={t('billing.saveBillBtn')}
                onPress={handleSaveBill}
                loading={loading}
                icon={<Ionicons name="checkmark-done-circle" size={22} color={colors.textWhite} />}
                style={styles.saveBtn}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bill Receipt Preview Modal */}
      <Modal
        visible={receiptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
              <Text style={styles.receiptTitle}>{t('billing.billCreated')}</Text>
              <Text style={styles.receiptDate}>
                {savedBill && new Date(savedBill.date).toLocaleString()}
              </Text>
            </View>

            <View style={styles.receiptBody}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('vendors.vendorName')}:</Text>
                <Text style={styles.receiptRowValue}>{savedBill?.vendor?.vendorName}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('flowers.flowerName')}:</Text>
                <Text style={styles.receiptRowValue}>{savedBill?.flower?.flowerName}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('billing.weightLabel')}:</Text>
                <Text style={styles.receiptRowValue}>{savedBill?.weightKg} kg</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>{t('billing.rateLabel')}:</Text>
                <Text style={styles.receiptRowValue}>₹{savedBill?.ratePerKg}/kg</Text>
              </View>

              <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                <Text style={styles.receiptTotalLabel}>{t('billing.totalAmount')}:</Text>
                <Text style={styles.receiptTotalValue}>
                  ₹{Number(savedBill?.totalAmount || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.receiptActions}>
              <Button
                title={t('billing.printOrShare')}
                onPress={handlePrintReceipt}
                variant="secondary"
                icon={<Ionicons name="print-outline" size={18} color={colors.textWhite} />}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={t('billing.createNew')}
                onPress={() => setReceiptModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  totalBanner: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 4,
  },
  saveBtn: {
    height: 52,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderRadius: 18,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  receiptDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  receiptBody: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  receiptRowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  receiptRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  receiptTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    marginTop: 8,
    paddingTop: 10,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  receiptActions: {
    flexDirection: 'row',
  },
});

export default NewBillScreen;
