import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { billService } from '../../services/api';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Card from '../../components/Card';
import colors from '../../theme/colors';

const DashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await billService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title={t('dashboard.title')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.responsiveContainer}>
          {/* Welcome Section */}
          <View style={styles.welcomeBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>{t('dashboard.welcome')}</Text>
              <Text style={styles.welcomeSubtitle}>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{t('common.ownerPortal')}</Text>
            </View>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : (
            <>
              {/* Today's Section */}
              <Text style={styles.sectionHeader}>{t('dashboard.todayOverview')}</Text>
              <View style={styles.statGrid}>
                <StatCard
                  title={t('dashboard.todayRevenue')}
                  value={formatCurrency(stats?.today?.revenue)}
                  subtitle={`${stats?.today?.billCount || 0} ${t('common.records')}`}
                  icon={<FontAwesome5 name="rupee-sign" size={16} color={colors.primary} />}
                  iconBgColor={colors.primarySubtle}
                />
                <StatCard
                  title={t('dashboard.todayWeight')}
                  value={`${Number(stats?.today?.weightKg || 0).toFixed(2)} ${t('dashboard.kg')}`}
                  subtitle={t('dashboard.todayBills')}
                  icon={<MaterialCommunityIcons name="scale" size={18} color="#d97706" />}
                  iconBgColor="#fef3c7"
                />
              </View>

              {/* Quick Action Button */}
              <View style={styles.quickActionBox}>
                <Button
                  title={t('dashboard.createBillBtn')}
                  onPress={() => navigation.navigate('Billing')}
                  icon={<Ionicons name="add-circle-outline" size={20} color={colors.textWhite} />}
                  style={styles.newBillBtn}
                />
              </View>

              {/* Monthly Section */}
              <Text style={styles.sectionHeader}>{t('dashboard.monthOverview')}</Text>
              <View style={styles.statGrid}>
                <StatCard
                  title={t('dashboard.monthRevenue')}
                  value={formatCurrency(stats?.month?.revenue)}
                  subtitle={`${stats?.month?.billCount || 0} ${t('nav.reports')}`}
                  icon={<Ionicons name="trending-up" size={18} color="#2563eb" />}
                  iconBgColor="#dbeafe"
                />
                <StatCard
                  title={t('dashboard.monthWeight')}
                  value={`${Number(stats?.month?.weightKg || 0).toFixed(2)} ${t('dashboard.kg')}`}
                  subtitle={`${stats?.totals?.vendors || 0} ${t('nav.vendors')}`}
                  icon={<MaterialCommunityIcons name="flower" size={18} color="#7c3aed" />}
                  iconBgColor="#ede9fe"
                />
              </View>

              {/* Recent Transactions List */}
              <View style={styles.recentHeaderRow}>
                <Text style={styles.sectionHeader}>{t('dashboard.recentBills')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Billing')}>
                  <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
                </TouchableOpacity>
              </View>

              {stats?.recentBills && stats.recentBills.length > 0 ? (
                stats.recentBills.map((bill) => (
                  <Card key={bill.id} style={styles.billCard}>
                    <View style={styles.billHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vendorName}>{bill.vendor?.vendorName || 'N/A'}</Text>
                        <Text style={styles.flowerVariety}>
                          🌸 {bill.flower?.flowerName || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.billTotalBadge}>
                        <Text style={styles.billTotalText}>{formatCurrency(bill.totalAmount)}</Text>
                      </View>
                    </View>

                    <View style={styles.billDetailsRow}>
                      <Text style={styles.billDetail}>
                        ⚖️ {bill.weightKg} {t('dashboard.kg')} × ₹{bill.ratePerKg}/kg
                      </Text>
                      <Text style={styles.billDate}>{formatDate(bill.date)}</Text>
                    </View>
                  </Card>
                ))
              ) : (
                <Card style={styles.emptyCard}>
                  <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.emptyText}>{t('common.noData')}</Text>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 10,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  quickActionBox: {
    marginVertical: 8,
  },
  newBillBtn: {
    height: 50,
    borderRadius: 12,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  billCard: {
    marginBottom: 10,
    padding: 14,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  flowerVariety: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  billTotalBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  billTotalText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  billDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  billDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  billDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
  },
});

export default DashboardScreen;
