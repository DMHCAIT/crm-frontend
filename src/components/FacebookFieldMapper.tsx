import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Settings
} from 'lucide-react';

interface FieldMapping {
  facebookField: string;
  crmField: string;
  required: boolean;
  defaultValue?: string;
}

interface FacebookFormField {
  name: string;
  label: string;
  type: string;
  options?: string[];
}

const FacebookFieldMapper: React.FC = () => {
  const [mappings, setMappings] = useState<FieldMapping[]>([
    { facebookField: 'full_name', crmField: 'name', required: true },
    { facebookField: 'email', crmField: 'email', required: true },
    { facebookField: 'phone_number', crmField: 'phone', required: false },
    { facebookField: 'company_name', crmField: 'company', required: false },
    { facebookField: 'job_title', crmField: 'designation', required: false },
    { facebookField: 'city', crmField: 'country', required: false },
    { facebookField: 'custom_question_1', crmField: 'branch', required: false },
    { facebookField: 'custom_question_2', crmField: 'qualification', required: false },
    { facebookField: 'custom_question_3', crmField: 'course', required: false }
  ]);

  const [availableFacebookFields] = useState<FacebookFormField[]>([
    { name: 'full_name', label: 'Full Name', type: 'text' },
    { name: 'first_name', label: 'First Name', type: 'text' },
    { name: 'last_name', label: 'Last Name', type: 'text' },
    { name: 'email', label: 'Email Address', type: 'email' },
    { name: 'phone_number', label: 'Phone Number', type: 'phone' },
    { name: 'company_name', label: 'Company Name', type: 'text' },
    { name: 'job_title', label: 'Job Title', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'state', label: 'State/Province', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'zip_code', label: 'Zip/Postal Code', type: 'text' },
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { name: 'gender', label: 'Gender', type: 'choice', options: ['Male', 'Female', 'Other'] },
    { name: 'custom_question_1', label: 'Custom Question 1', type: 'text' },
    { name: 'custom_question_2', label: 'Custom Question 2', type: 'text' },
    { name: 'custom_question_3', label: 'Custom Question 3', type: 'text' },
    { name: 'website', label: 'Website URL', type: 'text' }
  ]);

  const [availableCrmFields] = useState<string[]>([
    'name', 'email', 'phone', 'company', 'designation', 'country', 'branch', 
    'qualification', 'course', 'source', 'status', 'priority', 'notes'
  ]);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSavedMappings();
  }, []);

  const loadSavedMappings = () => {
    const savedMappings = localStorage.getItem('facebook_field_mappings');
    if (savedMappings) {
      try {
        const parsed = JSON.parse(savedMappings);
        setMappings(parsed);
      } catch (error) {
        console.error('Error loading saved mappings:', error);
      }
    }
  };

  const saveMappings = async () => {
    setLoading(true);
    try {
      localStorage.setItem('facebook_field_mappings', JSON.stringify(mappings));
      
      // Also save to backend for server-side processing
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/facebook/field-mappings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mappings })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMapping = () => {
    const newMapping: FieldMapping = {
      facebookField: '',
      crmField: '',
      required: false
    };
    setMappings([...mappings, newMapping]);
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, field: keyof FieldMapping, value: any) => {
    const updated = mappings.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    );
    setMappings(updated);
  };

  const validateMappings = () => {
    const errors: string[] = [];
    const usedCrmFields = new Set<string>();
    const usedFacebookFields = new Set<string>();

    mappings.forEach((mapping, index) => {
      if (!mapping.facebookField || !mapping.crmField) {
        errors.push(`Mapping ${index + 1}: Both Facebook and CRM fields are required`);
      }
      
      if (usedCrmFields.has(mapping.crmField)) {
        errors.push(`CRM field "${mapping.crmField}" is mapped multiple times`);
      }
      
      if (usedFacebookFields.has(mapping.facebookField)) {
        errors.push(`Facebook field "${mapping.facebookField}" is mapped multiple times`);
      }

      usedCrmFields.add(mapping.crmField);
      usedFacebookFields.add(mapping.facebookField);
    });

    return errors;
  };

  const errors = validateMappings();
  const isValid = errors.length === 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Field Mapping Configuration</h3>
            <p className="text-sm text-gray-600">Map Facebook lead form fields to CRM fields</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={addMapping}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Mapping</span>
          </button>
          <button
            onClick={saveMappings}
            disabled={loading || !isValid}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : saved ? 'Saved!' : 'Save Mappings'}</span>
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Configuration Issues</h4>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-4">Facebook Field</div>
            <div className="col-span-1 text-center">→</div>
            <div className="col-span-4">CRM Field</div>
            <div className="col-span-2">Required</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {mappings.map((mapping, index) => (
            <div key={index} className="px-4 py-3">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Facebook Field */}
                <div className="col-span-4">
                  <select
                    value={mapping.facebookField}
                    onChange={(e) => updateMapping(index, 'facebookField', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Facebook field...</option>
                    {availableFacebookFields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.label} ({field.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Arrow */}
                <div className="col-span-1 text-center">
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />
                </div>

                {/* CRM Field */}
                <div className="col-span-4">
                  <select
                    value={mapping.crmField}
                    onChange={(e) => updateMapping(index, 'crmField', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select CRM field...</option>
                    {availableCrmFields.map(field => (
                      <option key={field} value={field}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Required */}
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={mapping.required}
                      onChange={(e) => updateMapping(index, 'required', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <button
                    onClick={() => removeMapping(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default Field Mappings */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">Automatic Mappings</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>source:</strong> Always set to "Facebook Lead Ads"</p>
          <p><strong>status:</strong> Always set to "New"</p>
          <p><strong>priority:</strong> Set to "High" for webhook leads, "Medium" for manual imports</p>
          <p><strong>createdAt:</strong> Facebook lead creation timestamp</p>
          <p><strong>receivedAt:</strong> System processing timestamp</p>
        </div>
      </div>

      {/* Field Type Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Facebook Field Types Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-700 mb-1">Standard Fields</h5>
            <ul className="text-gray-600 space-y-1">
              <li>• full_name, first_name, last_name</li>
              <li>• email, phone_number</li>
              <li>• company_name, job_title</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-1">Location Fields</h5>
            <ul className="text-gray-600 space-y-1">
              <li>• city, state, country</li>
              <li>• zip_code</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-1">Custom Fields</h5>
            <ul className="text-gray-600 space-y-1">
              <li>• custom_question_1, 2, 3...</li>
              <li>• Custom questions from your forms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookFieldMapper;