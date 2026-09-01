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

    const dateFormatted = new Date(savedBill.date).toLocaleDateString();
    const timeFormatted = new Date(savedBill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const billIdShort = savedBill.id ? savedBill.id.substring(0, 8).toUpperCase() : '001';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>APL BILL - ${billIdShort}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 24px;
              color: #111827;
              background-color: #ffffff;
            }
            .bill-wrapper {
              max-width: 550px;
              margin: 0 auto;
              border: 2px solid #15803d;
              border-radius: 10px;
              padding: 20px;
            }
            .header-banner {
              text-align: center;
              border-bottom: 2px solid #15803d;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .main-title {
              font-size: 32px;
              font-weight: 900;
              color: #15803d;
              letter-spacing: 2px;
            }
            .subtitle {
              font-size: 13px;
              font-weight: bold;
              color: #374151;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .tagline {
              font-size: 11px;
              color: #6b7280;
              margin-top: 2px;
            }
            .meta-grid {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 16px;
              background-color: #f9fafb;
              padding: 10px;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .meta-col { line-height: 1.6; }
            .meta-label { color: #6b7280; font-weight: 600; }
            .meta-value { font-weight: bold; color: #111827; }

            /* Table Styles */
            .bill-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              font-size: 13px;
            }
            .bill-table th {
              background-color: #15803d;
              color: #ffffff;
              font-weight: 700;
              padding: 10px 8px;
              text-align: left;
              border: 1px solid #15803d;
            }
            .bill-table td {
              padding: 10px 8px;
              border: 1px solid #d1d5db;
              vertical-align: middle;
            }
            .bill-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .total-row td {
              background-color: #dcfce7 !important;
              font-size: 15px;
              font-weight: 800;
              color: #15803d;
              border-top: 2px solid #15803d;
              border-bottom: 2px solid #15803d;
            }

            .footer-section {
              text-align: center;
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px dashed #d1d5db;
              font-size: 11px;
              color: #6b7280;
            }
            .signature-box {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding: 0 10px;
              font-size: 12px;
              font-weight: bold;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="bill-wrapper">
            <!-- APL Header -->
            <div class="header-banner">
              <div class="main-title">APL</div>
              <div class="subtitle">FLOWER MERCHANTS & COMMISSION AGENT</div>
              <div class="tagline">Daily Flower Import & Billing Receipt</div>
            </div>

            <!-- Meta Details -->
            <div class="meta-grid">
              <div class="meta-col">
                <div><span class="meta-label">Bill No:</span> <span class="meta-value">#${billIdShort}</span></div>
                <div><span class="meta-label">Vendor:</span> <span class="meta-value">${savedBill.vendor?.vendorName || 'N/A'}</span></div>
                <div><span class="meta-label">Contact:</span> <span class="meta-value">${savedBill.vendor?.contactInfo || '-'}</span></div>
              </div>
              <div class="meta-col text-right">
                <div><span class="meta-label">Date:</span> <span class="meta-value">${dateFormatted}</span></div>
                <div><span class="meta-label">Time:</span> <span class="meta-value">${timeFormatted}</span></div>
              </div>
            </div>

            <!-- Structured Table (Row/Column Style) -->
            <table class="bill-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 10%;">S.No</th>
                  <th style="width: 40%;">Item / Flower Variety</th>
                  <th class="text-right" style="width: 15%;">Weight</th>
                  <th class="text-right" style="width: 15%;">Rate (₹)</th>
                  <th class="text-right" style="width: 20%;">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center">1</td>
                  <td><strong>${savedBill.flower?.flowerName || 'N/A'}</strong></td>
                  <td class="text-right">${Number(savedBill.weightKg).toFixed(2)} kg</td>
                  <td class="text-right">₹ ${Number(savedBill.ratePerKg).toFixed(2)}</td>
                  <td class="text-right" style="font-weight: 700;">₹ ${Number(savedBill.totalAmount).toFixed(2)}</td>
                </tr>
                <!-- Grand Total Row -->
                <tr class="total-row">
                  <td colspan="4" class="text-right">GRAND TOTAL:</td>
                  <td class="text-right">₹ ${Number(savedBill.totalAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Signatures -->
            <div class="signature-box">
              <div>Customer / Vendor Signature</div>
              <div>Authorized Signatory (APL)</div>
            </div>

            <!-- Footer -->
            <div class="footer-section">
              <p>நன்றி / Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          const printWindow = window.open('', '', 'width=700,height=750');
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
          style={styles.scrollView}
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
            {/* APL Main Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptMainTitle}>APL</Text>
              <Text style={styles.receiptSubTitle}>FLOWER MERCHANTS & BILLING</Text>
              <Text style={styles.receiptDate}>
                {savedBill && new Date(savedBill.date).toLocaleString()}
              </Text>
            </View>

            {/* Vendor Info Banner */}
            <View style={styles.vendorInfoBanner}>
              <Text style={styles.vendorInfoName}>{savedBill?.vendor?.vendorName || 'N/A'}</Text>
              {savedBill?.vendor?.contactInfo ? (
                <Text style={styles.vendorInfoContact}>📞 {savedBill?.vendor?.contactInfo}</Text>
              ) : null}
            </View>

            {/* Table Row / Column Format */}
            <View style={styles.tableContainer}>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Flower</Text>
                <Text style={[styles.tableHeaderCell, styles.textRight, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.tableHeaderCell, styles.textRight, { flex: 1 }]}>Rate/Kg</Text>
                <Text style={[styles.tableHeaderCell, styles.textRight, { flex: 1.2 }]}>Total</Text>
              </View>

              {/* Table Data Row */}
              <View style={styles.tableDataRow}>
                <Text style={[styles.tableDataCell, { flex: 2, fontWeight: '700' }]} numberOfLines={1}>
                  🌸 {savedBill?.flower?.flowerName || 'N/A'}
                </Text>
                <Text style={[styles.tableDataCell, styles.textRight, { flex: 1 }]}>
                  {savedBill?.weightKg} kg
                </Text>
                <Text style={[styles.tableDataCell, styles.textRight, { flex: 1 }]}>
                  ₹{savedBill?.ratePerKg}
                </Text>
                <Text style={[styles.tableDataCell, styles.textRight, { flex: 1.2, fontWeight: '700' }]}>
                  ₹{Number(savedBill?.totalAmount || 0).toFixed(2)}
                </Text>
              </View>

              {/* Table Grand Total Row */}
              <View style={styles.tableTotalRow}>
                <Text style={styles.tableTotalLabel}>GRAND TOTAL:</Text>
                <Text style={styles.tableTotalValue}>
                  ₹{Number(savedBill?.totalAmount || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
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
    maxWidth: 460,
    padding: 20,
    borderRadius: 18,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    marginBottom: 12,
  },
  receiptMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  receiptSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  receiptDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  vendorInfoBanner: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  vendorInfoName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vendorInfoContact: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  tableDataRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableDataCell: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  tableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySubtle,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tableTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  tableTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  textRight: {
    textAlign: 'right',
  },
  receiptActions: {
    flexDirection: 'row',
  },
});

export default NewBillScreen;
