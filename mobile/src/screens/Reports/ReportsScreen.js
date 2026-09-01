import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { billService, reportService } from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import colors from '../../theme/colors';

const ReportsScreen = () => {
  const { t, i18n } = useTranslation();

  // Generate list of recent 12 months for selector
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${monthNum}`;
      const label = d.toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-US', {
        month: 'long',
        year: 'numeric',
      });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '');
  const [monthData, setMonthData] = useState({
    bills: [],
    totalRevenue: 0,
    totalWeight: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchMonthBills = async (month) => {
    setLoading(true);
    try {
      const response = await billService.getBills({ month });
      const bills = response.data || [];

      let totalRevenue = 0;
      let totalWeight = 0;
      bills.forEach((b) => {
        totalRevenue += Number(b.totalAmount) || 0;
        totalWeight += Number(b.weightKg) || 0;
      });

      setMonthData({
        bills,
        totalRevenue,
        totalWeight,
        count: bills.length,
      });
    } catch (error) {
      console.error('Error fetching month bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthBills(selectedMonth);
    }
  }, [selectedMonth]);

  const handleDownloadReport = async (type) => {
    const isExcel = type === 'excel';
    if (isExcel) setDownloadingExcel(true);
    else setDownloadingPdf(true);

    try {
      const reportUrl = isExcel
        ? await reportService.getExcelReportUrl(selectedMonth)
        : await reportService.getPdfReportUrl(selectedMonth);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          const a = document.createElement('a');
          a.href = reportUrl;
          a.download = `APL_Billing_${selectedMonth}.${isExcel ? 'xlsx' : 'pdf'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        const ext = isExcel ? 'xlsx' : 'pdf';
        const fileUri = `${FileSystem.documentDirectory}APL_Billing_${selectedMonth}.${ext}`;

        const downloadResult = await FileSystem.downloadAsync(reportUrl, fileUri);

        if (downloadResult.status === 200) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadResult.uri, {
              mimeType: isExcel
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/pdf',
              dialogTitle: `Share APL Billing ${selectedMonth} Report`,
              UTI: isExcel
                ? 'com.microsoft.excel.xlsx'
                : 'com.adobe.pdf',
            });
          } else {
            Alert.alert(t('common.success'), t('reports.downloadComplete'));
          }
        } else {
          throw new Error('Download failed');
        }
      }
    } catch (error) {
      console.error('Download/Share error:', error);
      Alert.alert(t('common.error'), t('reports.shareFailed'));
    } finally {
      if (isExcel) setDownloadingExcel(false);
      else setDownloadingPdf(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title={t('reports.title')} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.responsiveContainer}>
          {/* Month Selector Carousel / Horizontal Pills */}
          <Text style={styles.sectionHeader}>{t('reports.selectMonth')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.monthScroll}
            contentContainerStyle={styles.monthScrollContent}
          >
            {monthOptions.map((opt) => {
              const isSelected = opt.value === selectedMonth;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.monthPill, isSelected && styles.monthPillActive]}
                  onPress={() => setSelectedMonth(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selected Month Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>{t('reports.summaryTitle')}</Text>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.summaryGrid}>
                <StatCard
                  title={t('dashboard.monthRevenue')}
                  value={formatCurrency(monthData.totalRevenue)}
                  subtitle={`${monthData.count} ${t('common.records')}`}
                  icon={<FontAwesome5 name="rupee-sign" size={16} color={colors.primary} />}
                  iconBgColor={colors.primarySubtle}
                />
                <StatCard
                  title={t('dashboard.monthWeight')}
                  value={`${monthData.totalWeight.toFixed(2)} ${t('dashboard.kg')}`}
                  subtitle={t('dashboard.todayOverview')}
                  icon={<MaterialCommunityIcons name="scale" size={18} color="#d97706" />}
                  iconBgColor="#fef3c7"
                />
              </View>
            )}
          </Card>

          {/* Download & Export Action Buttons */}
          <View style={styles.exportSection}>
            <Button
              title={t('reports.downloadExcel')}
              onPress={() => handleDownloadReport('excel')}
              loading={downloadingExcel}
              icon={<FontAwesome5 name="file-excel" size={18} color={colors.textWhite} />}
              style={styles.excelBtn}
            />

            <Button
              title={t('reports.downloadPdf')}
              onPress={() => handleDownloadReport('pdf')}
              loading={downloadingPdf}
              icon={<FontAwesome5 name="file-pdf" size={18} color={colors.textWhite} />}
              style={styles.pdfBtn}
            />
          </View>

          {/* Month Bills Listing Preview */}
          <Text style={styles.sectionHeader}>{t('dashboard.recentBills')}</Text>
          {monthData.bills.length > 0 ? (
            monthData.bills.slice(0, 10).map((bill) => (
              <Card key={bill.id} style={styles.billItemCard}>
                <View style={styles.billRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendorName}>{bill.vendor?.vendorName || 'N/A'}</Text>
                    <Text style={styles.flowerName}>🌸 {bill.flower?.flowerName || 'N/A'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.billTotal}>{formatCurrency(bill.totalAmount)}</Text>
                    <Text style={styles.billSub}>
                      {bill.weightKg}kg @ ₹{bill.ratePerKg}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </Card>
          )}
        </View>
      </ScrollView>
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
    maxWidth: 900,
    alignSelf: 'center',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  monthScroll: {
    marginBottom: 16,
  },
  monthScrollContent: {
    gap: 8,
  },
  monthPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  monthPillTextActive: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  exportSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  excelBtn: {
    backgroundColor: '#047857',
    height: 50,
    borderRadius: 12,
    flex: 1,
    minWidth: 220,
  },
  pdfBtn: {
    backgroundColor: '#dc2626',
    height: 50,
    borderRadius: 12,
    flex: 1,
    minWidth: 220,
  },
  billItemCard: {
    marginBottom: 8,
    padding: 12,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  flowerName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  billTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  billSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
  },
});

export default ReportsScreen;
