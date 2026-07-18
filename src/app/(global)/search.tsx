import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../theme";
import { useProfileStore } from "../../store/useProfileStore";

interface SearchItem {
  id: string;
  name: string;
  category: "Residents" | "Daily Help" | "Society Staff" | "Amenities" | "Services";
  detail: string;
  extra?: string;
  badge?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  avatar?: string;
  rating?: string;
}

export default function GlobalSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Electrician",
    "Unit 402",
    "Plumber",
  ]);

  const categories = [
    "All",
    "Residents",
    "Daily Help",
    "Society Staff",
    "Amenities",
    "Services",
  ];

  const searchItems: SearchItem[] = [
    {
      id: "res-1",
      name: "Robert Chen",
      category: "Society Staff",
      detail: "Society Manager",
      badge: "On Duty",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw_Y0zYH2kjgprO1b95-X2U9s18gNLcTFmfkBklp4GZ_9hYwcs2ofG34fdWs8XI5EXc5mBIowo9OeFwdj0J2DU7J-eCVZSMkYlmaIJbELgWPphDjykWy48XChyTi2JXUsex4tosrn5tCw9HYUdIsWGSYrJ5XRecyUDjyT_e1-rWEX4rvJaO-g4cGzYaxIT09DrVeoaxPzkOQJOtHELcBee2i9FLOEj3eJIMghbCWXfoYqep1anoQRnuA",
    },
    {
      id: "res-2",
      name: "Sarah Miller",
      category: "Residents",
      detail: "Unit 402 • Resident",
      extra: "Block B",
      icon: "location-on",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxEpqrCszbXqFNXGK4BENBWGxAGz_oErQXNnl1NeFr9DjIQf-CInJptwJSpWL8OWGGO-aPv3BDSUCL-Kp8GaVuSL3UW-v-6CgIquryYECMqH7B3WimZJq099rNb9CRFNw_-8GNZU_idcFgggFB4U2CLgYtVfW_hnxfGNqsNVbCzMk0l31rzgj0sitICiajTHYAQno0Cm6n-TqHQSZAXvW30zBHzs6xHAqvXPEcLfQCQ2Xx-CIjwSPzJQ",
    },
    {
      id: "res-3",
      name: "Emergency Electrician",
      category: "Services",
      detail: "Verified Service",
      rating: "4.9 (120 reviews)",
      icon: "electrical-services",
    },
    {
      id: "res-4",
      name: "Skyline Pool",
      category: "Amenities",
      detail: "Clubhouse • Level 5",
      badge: "Open till 10 PM",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoi6PjM8JQrl7AN_iRUCcMLJOQmq2pvXTvnnM_euPS2npADQYqfrG7cy5Z8zdtYzOFtLXjampg2sXh5NgQZjQZjpYIaEKIdhlTaOaUVLdjIZivVKZtsg8BsDyBtxZINInr-hHl59uoZuaXPyONYGcS7LTFIHpdeE14cx99lM5lPl9tCdY3uA4bXyRTNYmpOVGsPaMNhsAN6YQ0r6LghZvPDL3eWkI5Mov1Lbnawi449n1a-DFHywBdvw",
    },
    {
      id: "res-5",
      name: "Amit Sharma",
      category: "Residents",
      detail: "Unit 402-B • Resident",
      extra: "Block C",
      icon: "location-on",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOdDE5j2C-0ASjDtZNWk0ew-XXnz5MHm827U6HzT44T-bkzs9daP-O5g6qNEJw-MFqiQOE-oXfJ3k9zSmgv05o4h8a4iOcjDQjIF9YvDCQS8X9oKB4jc5IMjct3IdzBa4cQ2z4bfxVPIULqdhqxFE7zBCe64hgsV8MRpGxD9LMnUQGTuHjQtqCa_Rti2v-brPHTMH0XlSjI1-pGCu5WnWS-ZBTlQWYuXa5h2-fglctvHkVjb7NFXUOoQ",
    },
    {
      id: "res-6",
      name: "Elite Plumbing Group",
      category: "Services",
      detail: "Verified Service",
      rating: "4.8 (85 reviews)",
      icon: "plumbing",
    },
    {
      id: "res-7",
      name: "Clubhouse Gymnasium",
      category: "Amenities",
      detail: "Ground Floor",
      badge: "Open till 11 PM",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGPT-qG5A5NJuVBqlnlvGu64L0r1Ip8269KzywtLrQ8aX4lUvjsuxVB-9Jjgkp6Wc78sy6V3n4I_1nG2jHUE4KqjRe_f1bVxg8YW3GDns3M6DsSis9KrukBXPEVsTuDQiD32YjXgnUT0PwXcUgummA4InTxXAxW7k0f9glGrzIfxcXWqWc9zkbl1pAWhWTzJ2NQ74Cxy9tKB6p87zi-HygNk3343Hlc1l4dWT8FuSngpB1ta8n4q0bPA",
    },
  ];

  // Filtering Logic
  const filteredItems = searchItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  const handleRemoveRecent = (indexToRemove: number) => {
    setRecentSearches(recentSearches.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRecentPress = (query: string) => {
    setSearchQuery(query);
  };

  const handleQuickLinkPress = (link: string) => {
    if (link === "Society Manager") {
      setSelectedCategory("Society Staff");
      setSearchQuery("Manager");
    } else if (link === "Main Gate") {
      Alert.alert("Main Security Gate Contact", "Gate 1 Intercom: 101\nGate 2 Intercom: 102");
    } else if (link === "Emergency") {
      Alert.alert(
        "Emergency Contacts",
        "Ambulance: 102\nFire Force: 101\nSecurity Gate: 9999\nSociety Manager: 8888",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>HomeCircle</Text>
        </View>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjAfJ-MJod2F7IWqlUzQc8QUD3E5j5SA3UvktZOoDVk0fLgkHPbNP_COl1902Rp_6sq4aBZ0Kkv75DIRIomfxmx8A8dFWVn-hdAHRwrUoY2fDFyM9auzYY7iRDVknCucj8TN3Cre5o0bghTPPk0m7kS5bXpK46DZYNOxPmpito7XoS8lv4ZRTZIRzp6-qxHyLXRizsM8vE4AmPgt-2oXz3SvLEIyJWheXtdXLRRO8C7UksG4joaIvqOA",
            }}
            style={styles.avatar}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Input and Filter Icon */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialIcons name="search" size={22} color={theme.colors.outline} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search neighbors, staff, or services"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={20} color={theme.colors.outline} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => {
            Alert.alert("Filters", "Filter parameters can be toggled via category chips.");
          }}>
            <MaterialIcons name="filter-list" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Categories Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  isSelected
                    ? styles.chipSelected
                    : styles.chipUnselected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected
                      ? styles.chipTextSelected
                      : styles.chipTextUnselected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Two-Column Layout logic on large screen, simple vertical stacks on mobile */}
        <View style={styles.contentLayout}>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentSearchesCard}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentList}>
                {recentSearches.map((search, idx) => (
                  <View key={idx} style={styles.recentItem}>
                    <TouchableOpacity
                      style={styles.recentItemLeft}
                      onPress={() => handleRecentPress(search)}
                    >
                      <MaterialIcons name="history" size={20} color={theme.colors.outlineVariant} />
                      <Text style={styles.recentItemText}>{search}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveRecent(idx)}>
                      <MaterialIcons name="close" size={18} color={theme.colors.outlineVariant} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick Links */}
          <View style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            <View style={styles.quickLinksGrid}>
              <TouchableOpacity
                style={styles.quickLinkItem}
                onPress={() => handleQuickLinkPress("Society Manager")}
              >
                <MaterialIcons name="admin-panel-settings" size={20} color={theme.colors.secondary} />
                <Text style={styles.quickLinkLabel}>Society Manager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickLinkItem}
                onPress={() => handleQuickLinkPress("Main Gate")}
              >
                <MaterialIcons name="security" size={20} color={theme.colors.secondary} />
                <Text style={styles.quickLinkLabel}>Main Gate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickLinkItem, styles.quickLinkEmergency]}
                onPress={() => handleQuickLinkPress("Emergency")}
              >
                <MaterialIcons name="emergency" size={20} color={theme.colors.error} />
                <Text style={[styles.quickLinkLabel, { color: theme.colors.error }]}>Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Suggested / Search Results */}
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>
              {searchQuery || selectedCategory !== "All" ? "Search Results" : "Suggested for you"}
            </Text>
            
            {filteredItems.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={48} color={theme.colors.outlineVariant} />
                <Text style={styles.noResultsText}>No results found matching "{searchQuery}"</Text>
              </View>
            ) : (
              <View style={styles.resultsGrid}>
                {filteredItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultCard}
                    onPress={() => {
                      Alert.alert(item.name, `${item.detail}\nCategory: ${item.category}`);
                    }}
                  >
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.resultImage} />
                    ) : (
                      <View style={styles.resultIconWrapper}>
                        <MaterialIcons
                          name={item.icon || "person"}
                          size={32}
                          color={theme.colors.secondary}
                        />
                      </View>
                    )}
                    <View style={styles.resultInfo}>
                      <View style={styles.resultNameRow}>
                        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                        {item.category === "Society Staff" && (
                          <MaterialIcons name="verified" size={16} color={theme.colors.secondary} />
                        )}
                      </View>
                      <Text style={styles.resultDetail} numberOfLines={1}>{item.detail}</Text>
                      {item.extra && (
                        <View style={styles.resultExtraRow}>
                          <MaterialIcons name="location-on" size={14} color={theme.colors.onSurfaceVariant} />
                          <Text style={styles.resultExtraText}>{item.extra}</Text>
                        </View>
                      )}
                      {item.rating && (
                        <View style={styles.resultExtraRow}>
                          <MaterialIcons name="star" size={14} color="#f57f17" />
                          <Text style={[styles.resultExtraText, { color: theme.colors.secondary, fontWeight: "600" }]}>
                            {item.rating}
                          </Text>
                        </View>
                      )}
                      {item.badge && (
                        <Text style={styles.resultBadge}>{item.badge}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Help Center Banner */}
          <View style={styles.bannerContainer}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Can't find what you're looking for?</Text>
              <Text style={styles.bannerDesc}>
                Try using broader keywords or visit our Help Center for guidance on using HomeCircle.
              </Text>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => Alert.alert("Help Center", "Support ticket system coming soon.")}
              >
                <Text style={styles.bannerBtnText}>Visit Help Center</Text>
              </TouchableOpacity>
            </View>
            {/* Ambient Background Circle Effect */}
            <View style={styles.ambientBlob} pointerEvents="none" />
          </View>

        </View>
      </ScrollView>

      {/* Bottom Mock Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/")}>
          <MaterialIcons name="home" size={24} color={theme.colors.outline} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert("Services", "Services list coming soon.")}>
          <MaterialIcons name="settings" size={24} color={theme.colors.outline} />
          <Text style={styles.tabLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, styles.tabItemActive]}
          onPress={() => {
            if (profile?.role === "Guard" || profile?.role === "Admin") {
              router.push("/(global)/visitor-log");
            } else {
              Alert.alert("Access Denied", "Visitor log is restricted to Guards and Admins.");
            }
          }}
        >
          <MaterialIcons name="group" size={24} color={theme.colors.secondary} />
          <Text style={[styles.tabLabel, { color: theme.colors.secondary, fontWeight: "700" }]}>Visitors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert("Profile", "Profile edit coming soon.")}>
          <MaterialIcons name="person" size={24} color={theme.colors.outline} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.rounded.full,
  },
  appBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: theme.rounded.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  scrollContainer: {
    paddingBottom: 100, // Cushion for bottom bar
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 10,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  categoriesScroll: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  chipSelected: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  chipText: {
    ...theme.typography.labelMd,
    fontSize: 12,
  },
  chipTextSelected: {
    color: theme.colors.onSecondaryContainer,
    fontWeight: "600",
  },
  chipTextUnselected: {
    color: theme.colors.onSurfaceVariant,
  },
  contentLayout: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  recentSearchesCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.md,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)", // subtle outline variant
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  clearAllText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  recentList: {
    gap: 4,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  recentItemText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  quickLinksSection: {
    gap: theme.spacing.sm,
  },
  quickLinksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.rounded.md,
  },
  quickLinkEmergency: {
    backgroundColor: theme.colors.errorContainer,
  },
  quickLinkLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  resultsSection: {
    gap: theme.spacing.sm,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  noResultsText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  resultsGrid: {
    gap: theme.spacing.md,
  },
  resultCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.md,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    flexDirection: "row",
    gap: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resultImage: {
    width: 64,
    height: 64,
    borderRadius: theme.rounded.default,
    resizeMode: "cover",
  },
  resultIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: theme.rounded.default,
    backgroundColor: "rgba(0, 106, 97, 0.1)", // Light teal tint
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  resultName: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  resultDetail: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  resultExtraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  resultExtraText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  resultBadge: {
    ...theme.typography.labelMd,
    fontSize: 10,
    backgroundColor: theme.colors.secondaryContainer,
    color: theme.colors.onSecondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.rounded.full,
    marginTop: theme.spacing.xs,
    alignSelf: "flex-start",
  },
  bannerContainer: {
    backgroundColor: theme.colors.primary, // Security blue/black anchor
    padding: theme.spacing.lg,
    borderRadius: theme.rounded.md,
    position: "relative",
    overflow: "hidden",
  },
  bannerContent: {
    zIndex: 1,
    gap: theme.spacing.sm,
  },
  bannerTitle: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "700",
  },
  bannerDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.outlineVariant,
    lineHeight: 20,
  },
  bannerBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.rounded.default,
    alignSelf: "flex-start",
    marginTop: theme.spacing.sm,
  },
  bannerBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  ambientBlob: {
    position: "absolute",
    right: -40,
    bottom: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.colors.secondary,
    opacity: 0.2,
    transform: [{ scale: 1.5 }],
  },
  bottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  tabItemActive: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: theme.rounded.full,
    paddingVertical: 6,
  },
  tabLabel: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
    marginTop: 2,
  },
});
