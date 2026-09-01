import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { masterService } from '../../services/api';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import colors from '../../theme/colors';

const VendorMasterScreen = () => {
  const { t } = useTranslation();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchVendors = async () => {
    try {
      const response = await masterService.getVendors();
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVendors();
    }, [])
  );

  const openAddModal = () => {
    setEditingVendor(null);
    setVendorName('');
    setContactInfo('');
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setVendorName(vendor.vendorName);
    setContactInfo(vendor.contactInfo || '');
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!vendorName.trim()) {
      setFormError(t('common.required'));
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editingVendor) {
        await masterService.updateVendor(editingVendor.id, {
          vendorName: vendorName.trim(),
          contactInfo: contactInfo.trim(),
        });
      } else {
        await masterService.createVendor({
          vendorName: vendorName.trim(),
          contactInfo: contactInfo.trim(),
        });
      }
      setModalVisible(false);
      fetchVendors();
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (vendor) => {
    Alert.alert(
      t('common.delete'),
      `${t('common.confirmDelete')}\n\n"${vendor.vendorName}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await masterService.deleteVendor(vendor.id);
              fetchVendors();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error.response?.data?.error || 'Failed to delete vendor'
              );
            }
          },
        },
      ]
    );
  };

  const filteredVendors = vendors.filter((v) => {
    const term = searchQuery.toLowerCase();
    return (
      v.vendorName?.toLowerCase().includes(term) ||
      v.contactInfo?.toLowerCase().includes(term)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title={t('vendors.title')} />

      <View style={styles.content}>
        <View style={styles.responsiveContainer}>
          {/* Search and Add Row */}
          <View style={styles.actionRow}>
            <View style={styles.searchContainer}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('common.search')}
                icon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
                style={{ marginBottom: 0 }}
              />
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color={colors.textWhite} />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVendors}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchVendors();
                  }}
                  colors={[colors.primary]}
                />
              }
              renderItem={({ item }) => (
                <Card style={styles.vendorCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.vendorIconBox}>
                      <FontAwesome5 name="store" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorName}>{item.vendorName}</Text>
                      {item.contactInfo ? (
                        <Text style={styles.contactInfo}>📞 {item.contactInfo}</Text>
                      ) : null}
                    </View>
                    <View style={styles.billsCountBadge}>
                      <Text style={styles.billsCountText}>
                        {item._count?.bills || 0} {t('common.records')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => openEditModal(item)}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.info} />
                      <Text style={styles.editBtnText}>{t('common.edit')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}
              ListEmptyComponent={
                <Card style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>{t('common.noData')}</Text>
                </Card>
              }
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>

      {/* Add / Edit Vendor Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingVendor ? t('vendors.editVendor') : t('vendors.addVendor')}
            </Text>

            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <Input
              label={t('vendors.vendorName')}
              value={vendorName}
              onChangeText={(text) => {
                setVendorName(text);
                setFormError('');
              }}
              placeholder={t('vendors.vendorNamePlaceholder')}
              required
            />

            <Input
              label={t('vendors.contactInfo')}
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder={t('vendors.contactInfoPlaceholder')}
              keyboardType="phone-pad"
            />

            <View style={styles.modalBtnRow}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('common.save')}
                onPress={handleSave}
                loading={saving}
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
  content: {
    flex: 1,
    padding: 16,
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  listContent: {
    paddingBottom: 24,
  },
  vendorCard: {
    marginBottom: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contactInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  billsCountBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billsCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  editBtn: {
    backgroundColor: colors.infoLight,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info,
  },
  deleteBtn: {
    backgroundColor: colors.dangerLight,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default VendorMasterScreen;
