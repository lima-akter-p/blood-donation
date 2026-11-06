import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  getAdminUsers as getAdminUsersRequest,
  getAdminDashboardStats as getAdminDashboardStatsRequest,
  getAdminDonorCertificate as getAdminDonorCertificateRequest,
  getAdminDonorVerifications as getAdminDonorVerificationsRequest,
  getFundingSummary as getFundingSummaryRequest,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  register as registerRequest,
  resubmitDonorVerification as resubmitDonorVerificationRequest,
  reviewAdminDonorVerification as reviewAdminDonorVerificationRequest,
  updateAdminUserRole as updateAdminUserRoleRequest,
  updateAdminUserStatus as updateAdminUserStatusRequest,
  updateCurrentUser as updateCurrentUserRequest,
} from "../services/authApi";
import {
  createDonationRequest as createDonationRequestRequest,
  createFundingCheckout as createFundingCheckoutRequest,
  confirmDonation as confirmDonationRequest,
  deleteDonationRequest as deleteDonationRequestRequest,
  getDonationRequest as getDonationRequestRequest,
  getAllDonationRequests as getAllDonationRequestsRequest,
  getAdminDonationRequest as getAdminDonationRequestRequest,
  updateAdminDonationRequest as updateAdminDonationRequestRequest,
  deleteAdminDonationRequest as deleteAdminDonationRequestRequest,
  getMyDonationRequests as getMyDonationRequestsRequest,
  getFundingHistory as getFundingHistoryRequest,
  getPendingDonationRequest as getPendingDonationRequestRequest,
  updateDonationRequest as updateDonationRequestRequest,
  updateDonationRequestStatus as updateDonationRequestStatusRequest,
} from "../services/donationRequestApi";
import {
  getContactMessages as getContactMessagesRequest,
  markContactMessageRead as markContactMessageReadRequest,
  submitContactMessage as submitContactMessageRequest,
} from "../services/contactApi";
import {
  getNotifications as getNotificationsRequest,
  getUnreadNotificationCount as getUnreadNotificationCountRequest,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from "../services/notificationApi";
import { AuthContext } from "./authContext.js";

const TOKEN_KEY = "lifedrop_access_token";

function getStoredToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));
  const [restoreError, setRestoreError] = useState("");

  const clearSession = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const retrySession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setRestoreError("");
      return;
    }

    setLoading(true);
    setRestoreError("");
    try {
      const currentUser = await getCurrentUser(token);
      setUser(currentUser);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearSession();
      } else {
        setRestoreError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return undefined;

    let active = true;
    getCurrentUser(token)
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          window.sessionStorage.removeItem(TOKEN_KEY);
          setUser(null);
        } else {
          setRestoreError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(async (request) => {
    const result = await request;
    window.sessionStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    setRestoreError("");
    return result.user;
  }, []);

  const login = useCallback(
    (credentials) => authenticate(loginRequest(credentials)),
    [authenticate],
  );
  const loginWithGoogle = useCallback(async (idToken, profile, birthCertificate) => {
    const result = await loginWithGoogleRequest(idToken, profile, birthCertificate);
    if (result.requiresProfile) return result;

    window.sessionStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    setRestoreError("");
    return result;
  }, []);
  const register = useCallback(
    (details) => authenticate(registerRequest(details)),
    [authenticate],
  );
  const updateProfile = useCallback(async (profile) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    const updatedUser = await updateCurrentUserRequest(token, profile);
    setUser(updatedUser);
    return updatedUser;
  }, []);
  const resubmitDonorVerification = useCallback(async (details) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    const updatedUser = await resubmitDonorVerificationRequest(token, details);
    setUser(updatedUser);
    return updatedUser;
  }, []);
  const getAdminUsers = useCallback(async (options) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getAdminUsersRequest(token, options);
  }, []);
  const getAdminDonorVerifications = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getAdminDonorVerificationsRequest(token);
  }, []);
  const getAdminDonorCertificate = useCallback(async (userId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getAdminDonorCertificateRequest(token, userId);
  }, []);
  const reviewAdminDonorVerification = useCallback(async (userId, status) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return reviewAdminDonorVerificationRequest(token, userId, status);
  }, []);
  const getContactMessages = useCallback(async (options) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getContactMessagesRequest(token, options);
  }, []);
  const markContactMessageRead = useCallback(async (messageId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return markContactMessageReadRequest(token, messageId);
  }, []);
  const getNotifications = useCallback(async (page = 1) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getNotificationsRequest(token, page);
  }, []);
  const getUnreadNotificationCount = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getUnreadNotificationCountRequest(token);
  }, []);
  const markNotificationRead = useCallback(async (notificationId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return markNotificationReadRequest(token, notificationId);
  }, []);
  const markAllNotificationsRead = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return markAllNotificationsReadRequest(token);
  }, []);
  const submitContactMessage = useCallback(async (details) => (
    submitContactMessageRequest(details)
  ), []);
  const getAdminDashboardStats = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getAdminDashboardStatsRequest(token);
  }, []);
  const getFundingSummary = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getFundingSummaryRequest(token);
  }, []);
  const updateAdminUserStatus = useCallback(async (userId, status) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return updateAdminUserStatusRequest(token, userId, status);
  }, []);
  const updateAdminUserRole = useCallback(async (userId, role) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return updateAdminUserRoleRequest(token, userId, role);
  }, []);
  const createDonationRequest = useCallback(async (details) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return createDonationRequestRequest(token, details);
  }, []);
  const getFundingHistory = useCallback(async (options) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getFundingHistoryRequest(token, options);
  }, []);
  const createFundingCheckout = useCallback(async (details) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return createFundingCheckoutRequest(token, details);
  }, []);
  const getMyDonationRequests = useCallback(async (options) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getMyDonationRequestsRequest(token, options);
  }, []);
  const getAllDonationRequests = useCallback(async (options) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getAllDonationRequestsRequest(token, options);
  }, []);
  const getAdminDonationRequest = useCallback(async (requestId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getAdminDonationRequestRequest(token, requestId);
  }, []);
  const getDonationRequest = useCallback(async (requestId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getDonationRequestRequest(token, requestId);
  }, []);
  const getPendingDonationRequest = useCallback(async (requestId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return getPendingDonationRequestRequest(token, requestId);
  }, []);
  const confirmDonation = useCallback(async (requestId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return confirmDonationRequest(token, requestId);
  }, []);
  const updateDonationRequest = useCallback(async (requestId, details) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return user.role === "admin"
      ? updateAdminDonationRequestRequest(token, requestId, details)
      : updateDonationRequestRequest(token, requestId, details);
  }, [user]);
  const deleteDonationRequest = useCallback(async (requestId) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return user.role === "admin"
      ? deleteAdminDonationRequestRequest(token, requestId)
      : deleteDonationRequestRequest(token, requestId);
  }, [user]);
  const updateDonationRequestStatus = useCallback(async (requestId, status) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return updateDonationRequestStatusRequest(token, requestId, status);
  }, []);
  const logout = useCallback(() => {
    clearSession();
    setRestoreError("");
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      restoreError,
      login,
      loginWithGoogle,
      register,
      updateProfile,
      resubmitDonorVerification,
      getAdminUsers,
      getAdminDonorVerifications,
      getAdminDonorCertificate,
      reviewAdminDonorVerification,
      getContactMessages,
      markContactMessageRead,
      getNotifications,
      getUnreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      submitContactMessage,
      getAdminDashboardStats,
      getFundingSummary,
      updateAdminUserStatus,
      updateAdminUserRole,
      createDonationRequest,
      getFundingHistory,
      createFundingCheckout,
      getMyDonationRequests,
      getAllDonationRequests,
      getAdminDonationRequest,
      getDonationRequest,
      getPendingDonationRequest,
      confirmDonation,
      updateDonationRequest,
      deleteDonationRequest,
      updateDonationRequestStatus,
      logout,
      retrySession,
    }),
    [
      user,
      loading,
      restoreError,
      login,
      loginWithGoogle,
      register,
      updateProfile,
      resubmitDonorVerification,
      getAdminUsers,
      getAdminDonorVerifications,
      getAdminDonorCertificate,
      reviewAdminDonorVerification,
      getContactMessages,
      markContactMessageRead,
      getNotifications,
      getUnreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      submitContactMessage,
      getAdminDashboardStats,
      getFundingSummary,
      updateAdminUserStatus,
      updateAdminUserRole,
      createDonationRequest,
      getFundingHistory,
      createFundingCheckout,
      getMyDonationRequests,
      getAllDonationRequests,
      getAdminDonationRequest,
      getDonationRequest,
      getPendingDonationRequest,
      confirmDonation,
      updateDonationRequest,
      deleteDonationRequest,
      updateDonationRequestStatus,
      logout,
      retrySession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
