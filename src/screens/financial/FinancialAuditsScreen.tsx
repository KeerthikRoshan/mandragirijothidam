/**
 * FinancialAuditsScreen Component (நிதி தணிக்கைகள்)
 *
 * Dedicated screen for Peedam financial audits, devotee receivables,
 * and priest compensation settlements:
 * 1. Summary Metrics: Total Billed, Total Collected, Client Outstanding,
 *    Priest Remuneration, Priest Disbursed, Priest Pending, Net Peedam Margin.
 * 2. 4 Tab Views:
 *    - Overview / சுருக்கம்
 *    - Client Receivables / பக்தர் கட்டண நிலுவை
 *    - Priest Settlements / புரோகிதர் தீர்வுகள்
 *    - Audit Ledger / பரிவர்த்தனை கணக்கு
 * 3. Real backend API integration with graceful fallbacks.
 * 4. Real-time search & status filtering across all tabs.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  HandCoins,
  Receipt,
  Scale,
  Search,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ClientReceivableItem,
  FinancialAuditSummaryData,
  FinancialAuditTransactionItem,
  PriestSettlementItem,
} from '../../types/schedule';
import { FinancialAuditsScreenNavigationProp } from '../../types/navigation';
import { bookingApiService } from '../../services/bookingApiService';
import { SkeletonBookingCard, SkeletonStatCard } from '../../components/common/SkeletonLoader';

type FinancialTab = 'overview' | 'receivables' | 'settlements' | 'transactions';

export const FinancialAuditsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<FinancialAuditsScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const isTa = (i18n.language || 'ta').startsWith('ta');

  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Financial audit data states
  const [summary, setSummary] = useState<FinancialAuditSummaryData>({
    totalBookings: 0,
    totalBilled: 0,
    totalCollected: 0,
    clientOutstanding: 0,
    priestTotalDue: 0,
    priestSettled: 0,
    priestPendingSettlement: 0,
    netPeedamMargin: 0,
    fullyPaidCount: 0,
    partialPaidCount: 0,
    pendingPaidCount: 0,
    priestSettledCount: 0,
    priestPendingCount: 0,
  });

  const [receivables, setReceivables] = useState<ClientReceivableItem[]>([]);
  const [settlements, setSettlements] = useState<PriestSettlementItem[]>([]);
  const [transactions, setTransactions] = useState<FinancialAuditTransactionItem[]>([]);

  // Search queries per tab
  const [receivableSearch, setReceivableSearch] = useState<string>('');
  const [settlementSearch, setSettlementSearch] = useState<string>('');
  const [transactionSearch, setTransactionSearch] = useState<string>('');

  const loadAllFinancialData = useCallback(async () => {
    try {
      const [summaryRes, settlementsRes, transactionsRes] = await Promise.all([
        bookingApiService.getFinancialAuditSummary(),
        bookingApiService.getPriestSettlements(),
        bookingApiService.getFinancialAuditTransactions(),
      ]);

      if (summaryRes?.summary) {
        setSummary(summaryRes.summary);
      }
      if (summaryRes?.receivables) {
        setReceivables(summaryRes.receivables);
      }
      if (settlementsRes?.settlements) {
        setSettlements(settlementsRes.settlements);
      }
      if (transactionsRes?.transactions) {
        setTransactions(transactionsRes.transactions);
      }
    } catch (err) {
      console.warn('⚠️ [FinancialAuditsScreen] Failed to load financial data:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadAllFinancialData().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadAllFinancialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllFinancialData();
    setRefreshing(false);
  }, [loadAllFinancialData]);

  const formatCurrency = (amount: number = 0) => {
    return `₹ ${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  // Filtered Client Receivables
  const filteredReceivables = useMemo(() => {
    if (!receivableSearch.trim()) return receivables;
    const q = receivableSearch.toLowerCase().trim();
    return receivables.filter(
      (r) =>
        (r.clientName || '').toLowerCase().includes(q) ||
        (r.clientPhone || '').toLowerCase().includes(q) ||
        (r.bookingNumber || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q)
    );
  }, [receivables, receivableSearch]);

  // Filtered Priest Settlements
  const filteredSettlements = useMemo(() => {
    if (!settlementSearch.trim()) return settlements;
    const q = settlementSearch.toLowerCase().trim();
    return settlements.filter(
      (s) =>
        (s.priestName || '').toLowerCase().includes(q) ||
        (s.priestNameTamil || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    );
  }, [settlements, settlementSearch]);

  // Filtered Ledger Transactions
  const filteredTransactions = useMemo(() => {
    if (!transactionSearch.trim()) return transactions;
    const q = transactionSearch.toLowerCase().trim();
    return transactions.filter(
      (tx) =>
        (tx.bookingNumber || '').toLowerCase().includes(q) ||
        (tx.clientName || '').toLowerCase().includes(q) ||
        (tx.staffName || '').toLowerCase().includes(q) ||
        (tx.reference || '').toLowerCase().includes(q) ||
        (tx.transactionType || '').toLowerCase().includes(q)
    );
  }, [transactions, transactionSearch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Screen Header matching SettingsHeader */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color="#074735" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, isTa && styles.titleTamil]}>
            {t('financialAudits.title')}
          </Text>
          <Text style={[styles.subtitle, isTa && styles.subtitleTamil]}>
            {t('financialAudits.subtitle')}
          </Text>
        </View>

        <View style={styles.headerBadge}>
          <Scale size={16} color="#074735" />
        </View>
      </View>

      {/* Tabs Bar with smooth horizontal scroll */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <Pressable
            onPress={() => setActiveTab('overview')}
            style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'overview' && styles.tabTextActive,
                isTa && styles.tabTamilFont,
              ]}
            >
              {t('financialAudits.tabOverview')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('receivables')}
            style={[styles.tabItem, activeTab === 'receivables' && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'receivables' && styles.tabTextActive,
                isTa && styles.tabTamilFont,
              ]}
            >
              {t('financialAudits.tabReceivables')}
            </Text>
            {summary.pendingPaidCount + summary.partialPaidCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {summary.pendingPaidCount + summary.partialPaidCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('settlements')}
            style={[styles.tabItem, activeTab === 'settlements' && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'settlements' && styles.tabTextActive,
                isTa && styles.tabTamilFont,
              ]}
            >
              {t('financialAudits.tabSettlements')}
            </Text>
            {summary.priestPendingCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: '#FDE8E8' }]}>
                <Text style={[styles.countBadgeText, { color: '#B91C1C' }]}>
                  {summary.priestPendingCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('transactions')}
            style={[styles.tabItem, activeTab === 'transactions' && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'transactions' && styles.tabTextActive,
                isTa && styles.tabTamilFont,
              ]}
            >
              {t('financialAudits.tabTransactions')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#074735" />
        </View>
      ) : activeTab === 'overview' ? (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[styles.overviewContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#074735']}
              tintColor="#074735"
            />
          }
        >
          {/* Net Margin Highlight Card */}
          <View style={styles.netMarginCard}>
            <View style={styles.netMarginHeader}>
              <View style={styles.netMarginIconWrap}>
                <TrendingUp size={20} color="#8C6D23" />
              </View>
              <Text style={[styles.netMarginTitle, isTa && styles.tamilSmall]}>
                {t('financialAudits.netMargin')}
              </Text>
            </View>
            <Text style={styles.netMarginValue}>
              {formatCurrency(summary.netPeedamMargin)}
            </Text>
            <Text style={styles.netMarginSub}>
              {isTa
                ? `பெறப்பட்ட மொத்தத் தொகை - புரோகிதருக்கு வழங்கியது (${summary.totalBookings} முன்பதிவுகள்)`
                : `Total Collected - Priest Disbursed (${summary.totalBookings} Bookings)`}
            </Text>
          </View>

          {/* Devotee Receivables Section */}
          <View style={styles.sectionHeader}>
            <HandCoins size={16} color="#074735" />
            <Text style={[styles.sectionHeaderText, isTa && styles.tamilSmall]}>
              {isTa ? 'பக்தர் கட்டண நிலவரம்' : 'Client Receivables Breakdown'}
            </Text>
          </View>

          <View style={styles.metricGrid}>
            {/* Total Billed */}
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, isTa && styles.tamilLabel]}>
                {t('financialAudits.totalBilled')}
              </Text>
              <Text style={styles.metricValue}>
                {formatCurrency(summary.totalBilled)}
              </Text>
              <Text style={styles.metricSub}>
                {summary.totalBookings} {isTa ? 'முன்பதிவுகள்' : 'Bookings'}
              </Text>
            </View>

            {/* Total Collected */}
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, isTa && styles.tamilLabel]}>
                {t('financialAudits.totalCollected')}
              </Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                {formatCurrency(summary.totalCollected)}
              </Text>
              <Text style={styles.metricSub}>
                {summary.fullyPaidCount} {isTa ? 'முழு செலுத்தியது' : 'Fully Paid'}
              </Text>
            </View>

            {/* Client Outstanding */}
            <View style={[styles.metricCard, styles.metricCardSpan]}>
              <Text style={[styles.metricLabel, isTa && styles.tamilLabel]}>
                {t('financialAudits.clientOutstanding')}
              </Text>
              <Text style={[styles.metricValue, { color: summary.clientOutstanding > 0 ? '#DC2626' : '#059669' }]}>
                {formatCurrency(summary.clientOutstanding)}
              </Text>
              <Text style={styles.metricSub}>
                {summary.partialPaidCount + summary.pendingPaidCount} {isTa ? 'நிலுவை கணக்குகள்' : 'Pending Accounts'}
              </Text>
            </View>
          </View>

          {/* Priest Remuneration Section */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Users size={16} color="#074735" />
            <Text style={[styles.sectionHeaderText, isTa && styles.tamilSmall]}>
              {isTa ? 'புரோகிதர் கட்டணத் தீர்வு' : 'Priest Compensation Settlements'}
            </Text>
          </View>

          <View style={styles.metricGrid}>
            {/* Priest Total Due */}
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, isTa && styles.tamilLabel]}>
                {t('financialAudits.priestTotalDue')}
              </Text>
              <Text style={styles.metricValue}>
                {formatCurrency(summary.priestTotalDue)}
              </Text>
              <Text style={styles.metricSub}>
                {settlements.length} {isTa ? 'புரோகிதர்கள்' : 'Priests'}
              </Text>
            </View>

            {/* Priest Disbursed */}
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, isTa && styles.tamilLabel]}>
                {t('financialAudits.priestSettled')}
              </Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                {formatCurrency(summary.priestSettled)}
              </Text>
              <Text style={styles.metricSub}>
                {summary.priestSettledCount} {isTa ? 'தீர்வு கண்டவை' : 'Settled'}
              </Text>
            </View>

            {/* Priest Pending */}
            <View style={[styles.metricCard, styles.metricCardSpan]}>
              <Text style={[styles.metricLabel, isTa && styles.tamilLabel]}>
                {t('financialAudits.priestPending')}
              </Text>
              <Text style={[styles.metricValue, { color: summary.priestPendingSettlement > 0 ? '#D97706' : '#059669' }]}>
                {formatCurrency(summary.priestPendingSettlement)}
              </Text>
              <Text style={styles.metricSub}>
                {summary.priestPendingCount} {isTa ? 'புரோகிதர் நிலுவைகள்' : 'Pending Disbursements'}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'receivables' ? (
        <View style={styles.tabContainer}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, isTa && styles.searchTamil]}
              placeholder={t('financialAudits.searchBookings')}
              placeholderTextColor="#9CA3AF"
              value={receivableSearch}
              onChangeText={setReceivableSearch}
              clearButtonMode="while-editing"
            />
            {receivableSearch.length > 0 && (
              <Pressable onPress={() => setReceivableSearch('')} style={styles.clearButton}>
                <X size={14} color="#6B7280" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredReceivables}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#074735']}
                tintColor="#074735"
              />
            }
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleBlock}>
                    <Text style={[styles.itemTitle, isTa && styles.tamilSmall]}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemBookingNum}>
                      {item.bookingNumber} • {item.dateKey}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      item.clientPaymentStatus === 'completed'
                        ? styles.statusPillGreen
                        : item.clientPaymentStatus === 'partial'
                        ? styles.statusPillAmber
                        : styles.statusPillRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.clientPaymentStatus === 'completed'
                          ? styles.statusTextGreen
                          : item.clientPaymentStatus === 'partial'
                          ? styles.statusTextAmber
                          : styles.statusTextRed,
                      ]}
                    >
                      {item.clientPaymentStatus === 'completed'
                        ? t('financialAudits.settledStatus')
                        : item.clientPaymentStatus === 'partial'
                        ? t('financialAudits.partialStatus')
                        : t('financialAudits.pendingStatus')}
                    </Text>
                  </View>
                </View>

                {/* Devotee Row */}
                <View style={styles.personRow}>
                  <User size={13} color="#074735" style={styles.personIcon} />
                  <Text style={styles.personName}>{item.clientName}</Text>
                  {Boolean(item.clientPhone) && (
                    <Text style={styles.personPhone}>({item.clientPhone})</Text>
                  )}
                </View>

                {/* Financial Figures Row */}
                <View style={styles.figuresRow}>
                  <View style={styles.figureBox}>
                    <Text style={[styles.figureLabel, isTa && styles.tamilTiny]}>
                      {t('financialAudits.totalCharge')}
                    </Text>
                    <Text style={styles.figureValue}>
                      {formatCurrency(item.totalEventCharge)}
                    </Text>
                  </View>
                  <View style={styles.figureBox}>
                    <Text style={[styles.figureLabel, isTa && styles.tamilTiny]}>
                      {t('financialAudits.received')}
                    </Text>
                    <Text style={[styles.figureValue, { color: '#059669' }]}>
                      {formatCurrency(item.clientTotalReceived)}
                    </Text>
                  </View>
                  <View style={styles.figureBox}>
                    <Text style={[styles.figureLabel, isTa && styles.tamilTiny]}>
                      {t('financialAudits.balance')}
                    </Text>
                    <Text
                      style={[
                        styles.figureValue,
                        { color: item.clientBalanceAmount > 0 ? '#DC2626' : '#059669' },
                      ]}
                    >
                      {formatCurrency(item.clientBalanceAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Receipt size={40} color="#8C6D23" />
                <Text style={[styles.emptyTitle, isTa && styles.emptyTamilTitle]}>
                  {t('financialAudits.noReceivables')}
                </Text>
                <Text style={[styles.emptySubtitle, isTa && styles.emptyTamilSub]}>
                  {t('financialAudits.noReceivablesSub')}
                </Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'settlements' ? (
        <View style={styles.tabContainer}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, isTa && styles.searchTamil]}
              placeholder={t('financialAudits.searchPriests')}
              placeholderTextColor="#9CA3AF"
              value={settlementSearch}
              onChangeText={setSettlementSearch}
              clearButtonMode="while-editing"
            />
            {settlementSearch.length > 0 && (
              <Pressable onPress={() => setSettlementSearch('')} style={styles.clearButton}>
                <X size={14} color="#6B7280" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredSettlements}
            keyExtractor={(item) => String(item.priestId)}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#074735']}
                tintColor="#074735"
              />
            }
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleBlock}>
                    <Text style={[styles.itemTitle, isTa && styles.tamilSmall]}>
                      {isTa ? item.priestNameTamil || item.priestName : item.priestName}
                    </Text>
                    <Text style={styles.itemBookingNum}>
                      {item.staffRole || 'Priest'} • {item.bookingCount} {isTa ? 'பூஜைகள்' : 'Bookings'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      item.settlementStatus === 'settled'
                        ? styles.statusPillGreen
                        : item.settlementStatus === 'partial'
                        ? styles.statusPillAmber
                        : styles.statusPillRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.settlementStatus === 'settled'
                          ? styles.statusTextGreen
                          : item.settlementStatus === 'partial'
                          ? styles.statusTextAmber
                          : styles.statusTextRed,
                      ]}
                    >
                      {item.settlementStatus === 'settled'
                        ? t('financialAudits.settledStatus')
                        : item.settlementStatus === 'partial'
                        ? t('financialAudits.partialStatus')
                        : t('financialAudits.pendingStatus')}
                    </Text>
                  </View>
                </View>

                {/* Figures Row */}
                <View style={styles.figuresRow}>
                  <View style={styles.figureBox}>
                    <Text style={[styles.figureLabel, isTa && styles.tamilTiny]}>
                      {t('financialAudits.agreedPay')}
                    </Text>
                    <Text style={styles.figureValue}>
                      {formatCurrency(item.totalPay)}
                    </Text>
                  </View>
                  <View style={styles.figureBox}>
                    <Text style={[styles.figureLabel, isTa && styles.tamilTiny]}>
                      {t('financialAudits.advancePaid')}
                    </Text>
                    <Text style={[styles.figureValue, { color: '#059669' }]}>
                      {formatCurrency(item.advancePaid)}
                    </Text>
                  </View>
                  <View style={styles.figureBox}>
                    <Text style={[styles.figureLabel, isTa && styles.tamilTiny]}>
                      {t('financialAudits.balanceDue')}
                    </Text>
                    <Text
                      style={[
                        styles.figureValue,
                        { color: item.balanceDue > 0 ? '#D97706' : '#059669' },
                      ]}
                    >
                      {formatCurrency(item.balanceDue)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={40} color="#8C6D23" />
                <Text style={[styles.emptyTitle, isTa && styles.emptyTamilTitle]}>
                  {t('financialAudits.noSettlements')}
                </Text>
                <Text style={[styles.emptySubtitle, isTa && styles.emptyTamilSub]}>
                  {t('financialAudits.noSettlementsSub')}
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <View style={styles.tabContainer}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, isTa && styles.searchTamil]}
              placeholder={t('financialAudits.searchTransactions')}
              placeholderTextColor="#9CA3AF"
              value={transactionSearch}
              onChangeText={setTransactionSearch}
              clearButtonMode="while-editing"
            />
            {transactionSearch.length > 0 && (
              <Pressable onPress={() => setTransactionSearch('')} style={styles.clearButton}>
                <X size={14} color="#6B7280" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#074735']}
                tintColor="#074735"
              />
            }
            renderItem={({ item }) => {
              const isClient = item.party === 'client';
              return (
                <View style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.txPartyRow}>
                      <View
                        style={[
                          styles.txPartyIcon,
                          isClient ? styles.txPartyIconIn : styles.txPartyIconOut,
                        ]}
                      >
                        {isClient ? (
                          <ArrowDownLeft size={16} color="#059669" />
                        ) : (
                          <ArrowUpRight size={16} color="#D97706" />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.itemTitle, isTa && styles.tamilSmall]}>
                          {isClient
                            ? t('financialAudits.partyClient')
                            : t('financialAudits.partyPriest')}
                        </Text>
                        <Text style={styles.itemBookingNum}>
                          {item.bookingNumber || `ID #${item.bookingId}`} • {item.paymentMethod?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        isClient ? styles.txAmountIn : styles.txAmountOut,
                      ]}
                    >
                      {isClient ? '+' : '-'} {formatCurrency(item.amount)}
                    </Text>
                  </View>

                  <View style={styles.txDetailsRow}>
                    <Text style={styles.txDetailText} numberOfLines={1}>
                      {isClient
                        ? `${item.clientName || 'Devotee'}`
                        : `${item.staffName || 'Priest'}`}
                    </Text>
                    {Boolean(item.paidAt) && (
                      <Text style={styles.txDateText}>
                        {new Date(item.paidAt!).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Receipt size={40} color="#8C6D23" />
                <Text style={[styles.emptyTitle, isTa && styles.emptyTamilTitle]}>
                  {t('financialAudits.noTransactions')}
                </Text>
                <Text style={[styles.emptySubtitle, isTa && styles.emptyTamilSub]}>
                  {t('financialAudits.noTransactionsSub')}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073E2E',
    letterSpacing: -0.3,
  },
  titleTamil: {
    fontSize: 17,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#68756F',
    marginTop: 2,
  },
  subtitleTamil: {
    fontSize: 11,
    lineHeight: 15,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D2E3DB',
  },
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  tabItemActive: {
    borderBottomColor: '#074735',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#074735',
    fontWeight: '700',
  },
  tabTamilFont: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  contentScroll: {
    flex: 1,
  },
  overviewContent: {
    padding: 16,
  },
  tabContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netMarginCard: {
    backgroundColor: '#074735',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  netMarginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  netMarginIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  netMarginTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  netMarginValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  netMarginSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#074735',
  },
  tamilSmall: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricCardSpan: {
    width: '100%',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 16,
  },
  tamilLabel: {
    fontSize: 10.5,
    lineHeight: 15,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
    lineHeight: 22,
  },
  metricSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    padding: 0,
  },
  searchTamil: {
    fontSize: 12,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemBookingNum: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillGreen: {
    backgroundColor: '#E6F4EA',
  },
  statusPillAmber: {
    backgroundColor: '#FEF3C7',
  },
  statusPillRed: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextGreen: {
    color: '#059669',
  },
  statusTextAmber: {
    color: '#D97706',
  },
  statusTextRed: {
    color: '#DC2626',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  personIcon: {
    marginRight: 4,
  },
  personName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  personPhone: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  figuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  figureBox: {
    alignItems: 'center',
  },
  figureLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  tamilTiny: {
    fontSize: 9,
  },
  figureValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  txPartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txPartyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txPartyIconIn: {
    backgroundColor: '#E6F4EA',
  },
  txPartyIconOut: {
    backgroundColor: '#FEF3C7',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txAmountIn: {
    color: '#059669',
  },
  txAmountOut: {
    color: '#D97706',
  },
  txDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  txDetailText: {
    fontSize: 11,
    color: '#4B5563',
    flex: 1,
  },
  txDateText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyTamilTitle: {
    fontSize: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  emptyTamilSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
