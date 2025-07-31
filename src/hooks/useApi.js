import useSWR from 'swr';
import axios from 'axios';

const API_BASE = "http://localhost:8000/api";

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem("token");

// Axios fetcher with auth headers
const fetcher = async (url) => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');
  
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Custom hook for search history
export const useSearchHistory = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE}/search-history`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
    }
  );

  return {
    searchHistory: data || [],
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Function to save search to history
export const saveSearchToHistory = async (searchData) => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');

  const response = await axios.post(`${API_BASE}/search-history`, searchData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Function to delete search history items
export const deleteSearchHistory = async (ipAddresses) => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');

  const response = await axios.delete(`${API_BASE}/search-history`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { ipAddresses }
  });
  return response.data;
};

// Function to fetch geolocation data
export const fetchGeolocation = async (ip) => {
  const response = await axios.get(`https://ipinfo.io/${ip}/geo`);
  return response.data;
};

// Function to get user's public IP
export const fetchUserIp = async () => {
  const response = await axios.get("https://api.ipify.org?format=json");
  return response.data.ip;
};
