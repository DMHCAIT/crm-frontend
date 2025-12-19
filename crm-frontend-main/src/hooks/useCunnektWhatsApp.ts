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
    getMessageStatus
  };
};
