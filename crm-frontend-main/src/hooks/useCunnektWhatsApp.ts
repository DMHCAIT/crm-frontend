import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BACKEND_URL?.replace('/api', '') || 'https://crm-backend-vvpn.onrender.com';

interface SendMessageParams {
  phone: string;
  message: string;
  leadId?: string;
}

interface SendBulkParams {
  leads: any[];
  message: string;
  campaignId?: string;
}

interface SendTemplateParams {
  phone: string;
  templateName: string;
  parameters?: string[];
  leadId?: string;
}

interface SaveCampaignParams {
  name: string;
  template: string;
  segmentFilters?: any;
  leadCount?: number;
  userId?: string;
}

export const useCunnektWhatsApp = () => {
  // Test API connection
  const testConnection = useQuery({
    queryKey: ['cunnekt-test'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/cunnekt-whatsapp?action=test-connection`, {
        withCredentials: true
      });
      return response.data;
    },
    enabled: false // Only run when explicitly called
  });

  // Get all campaigns
  const campaigns = useQuery({
    queryKey: ['cunnekt-campaigns'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/cunnekt-whatsapp?action=get-campaigns`, {
        withCredentials: true
      });
      return response.data;
    }
  });

  // Get WhatsApp responses
  const responses = useQuery({
    queryKey: ['cunnekt-responses'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/cunnekt-whatsapp?action=get-responses`, {
        withCredentials: true
      });
      return response.data;
    }
  });

  // Save campaign
  const saveCampaign = useMutation({
    mutationFn: async (params: SaveCampaignParams) => {
      const response = await axios.post(
        `${API_URL}/api/cunnekt-whatsapp?action=save-campaign`,
        params,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      // Refetch campaigns after saving
      campaigns.refetch();
    }
  });

  // Send single message
  const sendMessage = useMutation({
    mutationFn: async (params: SendMessageParams) => {
      const response = await axios.post(
        `${API_URL}/api/cunnekt-whatsapp?action=send-message`,
        params,
        { withCredentials: true }
      );
      return response.data;
    }
  });

  // Send bulk messages
  const sendBulk = useMutation({
    mutationFn: async (params: SendBulkParams) => {
      const response = await axios.post(
        `${API_URL}/api/cunnekt-whatsapp?action=send-bulk`,
        params,
        { withCredentials: true }
      );
      return response.data;
    }
  });

  // Send template message
  const sendTemplate = useMutation({
    mutationFn: async (params: SendTemplateParams) => {
      const response = await axios.post(
        `${API_URL}/api/cunnekt-whatsapp?action=send-template`,
        params,
        { withCredentials: true }
      );
      return response.data;
    }
  });

  // Get message status
  const getMessageStatus = async (messageId: string) => {
    const response = await axios.get(
      `${API_URL}/api/cunnekt-whatsapp?action=get-status&messageId=${messageId}`,
      { withCredentials: true }
    );
    return response.data;
  };

  return {
    testConnection,
    sendMessage,
    sendBulk,
    sendTemplate,
    getMessageStatus,
    campaigns,
    responses,
    saveCampaign
  };
};
