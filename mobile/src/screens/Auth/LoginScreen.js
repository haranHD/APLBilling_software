import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL_KEY } from '../../services/api';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import colors from '../../theme/colors';

const LoginScreen = () => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server IP Settings Modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || t('auth.invalidCredentials'));
    }
  };

  const handleSaveServerUrl = async () => {
    try {
      if (customServerUrl.trim()) {
        await AsyncStorage.setItem(API_BASE_URL_KEY, customServerUrl.trim());
        Alert.alert(t('common.success'), 'Server URL updated successfully!');
      } else {
        await AsyncStorage.removeItem(API_BASE_URL_KEY);
        Alert.alert(t('common.success'), 'Server URL reset to default!');
      }
      setServerModalVisible(false);
    } catch (e) {
      Alert.alert(t('common.error'), 'Failed to save server URL');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title={t('common.appName')} showLogout={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.responsiveContainer}>
            {/* Logo & Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="flower" size={48} color={colors.primary} />
              </View>
              <Text style={styles.brandName}>APL Billing</Text>
              <Text style={styles.brandSubtitle}>{t('auth.loginSubtitle')}</Text>
            </View>

            {/* Login Card */}
            <Card style={styles.card}>
              <Text style={styles.formTitle}>{t('auth.loginTitle')}</Text>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <Input
                label={t('auth.username')}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setErrorMessage('');
                }}
                placeholder={t('auth.usernamePlaceholder')}
                icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                required
              />

              <Input
                label={t('auth.password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                }}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                required
              />

              <Button
                title={t('auth.loginBtn')}
                onPress={handleLogin}
                loading={loading}
                style={styles.submitBtn}
              />

              {/* Server Settings Link */}
              <TouchableOpacity
                style={styles.serverConfigBtn}
                onPress={() => setServerModalVisible(true)}
              >
                <Ionicons name="server-outline" size={14} color={colors.textMuted} />
                <Text style={styles.serverConfigText}>Configure Server IP / Host</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Server IP Config Modal */}
      <Modal
        visible={serverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.serverModalCard}>
            <Text style={styles.modalHeader}>API Server IP Configuration</Text>
            <Text style={styles.modalNote}>
              Set the backend API URL (e.g. http://localhost:5000/api):
            </Text>
            <TextInput
              style={styles.serverInput}
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              placeholder="http://localhost:5000/api"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setServerModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t('common.save')}
                onPress={handleSaveServerUrl}
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
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    padding: 22,
    borderRadius: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 10,
  },
  serverConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  serverConfigText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serverModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
  },
  modalHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  serverInput: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default LoginScreen;
