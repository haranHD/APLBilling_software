import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { switchLanguage } from '../i18n';
import { AuthContext } from '../context/AuthContext';
import colors from '../theme/colors';

const Header = ({ title, showLogout = true }) => {
  const { t, i18n } = useTranslation();
  const { logout } = useContext(AuthContext);

  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ta' ? 'en' : 'ta';
    switchLanguage(nextLang);
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('common.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title || t('common.appName')}
          </Text>
        </View>

        <View style={styles.actions}>
          {/* Language Toggle Pill */}
          <TouchableOpacity
            style={styles.langButton}
            onPress={toggleLanguage}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.langText}>
              {currentLang === 'ta' ? 'English' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>

          {/* Logout Button */}
          {showLogout && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  logoutButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
});

export default Header;
